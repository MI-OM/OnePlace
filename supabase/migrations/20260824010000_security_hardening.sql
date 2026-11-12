-- =============================================================================
-- Security hardening (code review, Nov 2026)
--
-- Closes RLS holes reachable directly through the public REST API with the
-- anon key + a normal user session. The app's own server code uses the
-- service-role client, which bypasses RLS and these triggers, so app
-- behaviour is unchanged.
--
-- Triggers only restrict API callers (auth.role() in anon/authenticated);
-- service_role and migrations/SQL editor (no JWT) are not affected.
-- =============================================================================

create or replace function public.is_api_caller()
returns boolean
language sql
stable
set search_path = public
as $$
    select coalesce(auth.role(), '') in ('anon', 'authenticated');
$$;

-- -----------------------------------------------------------------------------
-- 1. business_products: was "FOR ALL USING (authenticated)" -> anyone could
--    edit/delete every business's products.
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated manage products" on public.business_products;
drop policy if exists "Service role full access products" on public.business_products;

create policy "business_products_manage_admin_member" on public.business_products
for all to authenticated
using (public.is_business_admin(business_id) or public.is_platform_admin())
with check (public.is_business_admin(business_id) or public.is_platform_admin());

-- -----------------------------------------------------------------------------
-- 2. Storage: any signed-in user could overwrite/delete any file.
--    business-images paths: <businessId>/..., gallery/<businessId>/...,
--    categories/... (admins). profile-images: owned by the uploader.
-- -----------------------------------------------------------------------------
create or replace function public.storage_business_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
declare
    parts text[] := string_to_array(object_name, '/');
    candidate text;
begin
    candidate := case when parts[1] = 'gallery' then parts[2] else parts[1] end;
    if candidate ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        return candidate::uuid;
    end if;
    return null;
end;
$$;

drop policy if exists "Authenticated upload to business-images" on storage.objects;
drop policy if exists "Authenticated update business-images" on storage.objects;
drop policy if exists "Authenticated delete business-images" on storage.objects;

create policy "business_images_insert" on storage.objects
for insert to authenticated
with check (
    bucket_id = 'business-images'
    and (
        public.is_platform_admin()
        or public.is_business_admin(public.storage_business_id(name))
    )
);

create policy "business_images_update" on storage.objects
for update to authenticated
using (
    bucket_id = 'business-images'
    and (
        public.is_platform_admin()
        or public.is_business_admin(public.storage_business_id(name))
    )
);

create policy "business_images_delete" on storage.objects
for delete to authenticated
using (
    bucket_id = 'business-images'
    and (
        public.is_platform_admin()
        or public.is_business_admin(public.storage_business_id(name))
    )
);

drop policy if exists "Authenticated update profile images" on storage.objects;
drop policy if exists "Authenticated delete profile images" on storage.objects;

create policy "profile_images_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'profile-images' and owner = auth.uid());

create policy "profile_images_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'profile-images' and owner = auth.uid());

-- -----------------------------------------------------------------------------
-- 3. businesses: any member (even staff) could self-verify, feature, sponsor,
--    activate, change slug or poison their search embedding.
-- -----------------------------------------------------------------------------
drop policy if exists "businesses_update_member" on public.businesses;
create policy "businesses_update_member" on public.businesses
for update to authenticated
using (public.is_business_admin(id))
with check (public.is_business_admin(id));

create or replace function public.protect_business_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_api_caller() or public.is_platform_admin() then
        return new;
    end if;
    if new.status is distinct from old.status
       or new.verification_status is distinct from old.verification_status
       or new.is_featured is distinct from old.is_featured
       or new.is_sponsored is distinct from old.is_sponsored
       or new.slug is distinct from old.slug
       or new.embedding is distinct from old.embedding then
        raise exception 'Only platform admins can change status, verification, featured, sponsored, slug or embedding'
            using errcode = '42501';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_protect_business_columns on public.businesses;
create trigger trg_protect_business_columns
before update on public.businesses
for each row execute function public.protect_business_columns();

-- -----------------------------------------------------------------------------
-- 4. business_members: a manager could promote themselves to owner or remove
--    the owner.
-- -----------------------------------------------------------------------------
create or replace function public.protect_business_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    caller_is_owner boolean;
begin
    if not public.is_api_caller() or public.is_platform_admin() then
        return coalesce(new, old);
    end if;

    select exists (
        select 1 from public.business_members bm
        where bm.business_id = coalesce(new.business_id, old.business_id)
          and bm.user_id = auth.uid()
          and bm.status = 'active'
          and bm.role = 'owner'
    ) into caller_is_owner;

    if (tg_op in ('INSERT', 'UPDATE') and new.role = 'owner')
       or (tg_op in ('UPDATE', 'DELETE') and old.role = 'owner') then
        if not caller_is_owner then
            raise exception 'Only an owner can grant, change or remove ownership'
                using errcode = '42501';
        end if;
    end if;

    if tg_op = 'UPDATE' and new.business_id is distinct from old.business_id then
        raise exception 'business_id cannot be changed' using errcode = '42501';
    end if;

    return coalesce(new, old);
end;
$$;

drop trigger if exists trg_protect_business_ownership on public.business_members;
create trigger trg_protect_business_ownership
before insert or update or delete on public.business_members
for each row execute function public.protect_business_ownership();

-- -----------------------------------------------------------------------------
-- 5. messages: customers could insert rows as 'ai_agent' / 'business_staff'
--    (fake AI promises fed back to the LLM as assistant turns).
-- -----------------------------------------------------------------------------
drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages
for insert to authenticated
with check (
    sender_user_id = auth.uid()
    and exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (
              (sender_type = 'customer' and c.customer_id = auth.uid())
              or (sender_type = 'business_staff'
                  and c.business_id is not null
                  and public.is_business_member(c.business_id))
          )
    )
);

-- -----------------------------------------------------------------------------
-- 6. conversations / service_requests: freeze who the row belongs to.
--    (A member could re-point customer_id to spam any user's inbox; a
--    customer could move a request to another business or mark it done.)
-- -----------------------------------------------------------------------------
create or replace function public.freeze_conversation_parties()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_api_caller() or public.is_platform_admin() then
        return new;
    end if;
    if new.customer_id is distinct from old.customer_id
       or new.business_id is distinct from old.business_id then
        raise exception 'customer_id and business_id cannot be changed'
            using errcode = '42501';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_freeze_conversation_parties on public.conversations;
create trigger trg_freeze_conversation_parties
before update on public.conversations
for each row execute function public.freeze_conversation_parties();

create or replace function public.protect_service_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_api_caller() or public.is_platform_admin() then
        return new;
    end if;
    if new.customer_id is distinct from old.customer_id
       or new.business_id is distinct from old.business_id
       or new.conversation_id is distinct from old.conversation_id then
        raise exception 'request ownership cannot be changed' using errcode = '42501';
    end if;
    -- Customers (non-members) may only cancel.
    if new.status is distinct from old.status
       and not (old.business_id is not null and public.is_business_member(old.business_id))
       and new.status <> 'cancelled' then
        raise exception 'Customers can only cancel a request' using errcode = '42501';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_protect_service_request_update on public.service_requests;
create trigger trg_protect_service_request_update
before update on public.service_requests
for each row execute function public.protect_service_request_update();

-- -----------------------------------------------------------------------------
-- 7. bookings: customers could self-confirm or move bookings; removed staff
--    kept access to customer PII; nothing prevented double booking.
-- -----------------------------------------------------------------------------
drop policy if exists "business_bookings_all" on public.bookings;
create policy "business_bookings_all" on public.bookings
for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "customer_bookings_insert" on public.bookings;
create policy "customer_bookings_insert" on public.bookings
for insert to authenticated
with check (
    customer_id = auth.uid()
    and status = 'pending'
    and exists (
        select 1 from public.businesses b
        where b.id = business_id and b.status = 'active' and b.deleted_at is null
    )
    and (
        staff_member_id is null
        or exists (
            select 1 from public.business_members bm
            where bm.id = staff_member_id
              and bm.business_id = bookings.business_id
              and bm.status = 'active'
        )
    )
);

drop policy if exists "customer_bookings_update" on public.bookings;
create policy "customer_bookings_update" on public.bookings
for update to authenticated
using (customer_id = auth.uid())
with check (customer_id = auth.uid() and status = 'cancelled');

create or replace function public.protect_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_api_caller() or public.is_business_member(old.business_id)
       or public.is_platform_admin() then
        return new;
    end if;
    -- Customer path: only the status may change (to cancelled, per policy).
    if (new.business_id, new.service_id, new.staff_member_id, new.booking_date,
        new.start_time, new.end_time, new.customer_id)
       is distinct from
       (old.business_id, old.service_id, old.staff_member_id, old.booking_date,
        old.start_time, old.end_time, old.customer_id) then
        raise exception 'Customers can only cancel a booking' using errcode = '42501';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_protect_booking_update on public.bookings;
create trigger trg_protect_booking_update
before update on public.bookings
for each row execute function public.protect_booking_update();

-- Overlap guard for every writer (service role included). A trigger with an
-- advisory lock instead of an exclusion constraint so existing overlapping
-- rows don't block this migration.
create or replace function public.prevent_double_booking()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if new.end_time <= new.start_time then
        raise exception 'Booking must end after it starts' using errcode = '23514';
    end if;
    if new.staff_member_id is null or new.status not in ('pending', 'confirmed') then
        return new;
    end if;

    perform pg_advisory_xact_lock(
        hashtext(new.staff_member_id::text || ':' || new.booking_date::text)
    );

    if exists (
        select 1 from public.bookings b
        where b.staff_member_id = new.staff_member_id
          and b.booking_date = new.booking_date
          and b.status in ('pending', 'confirmed')
          and b.id is distinct from new.id
          and b.start_time < new.end_time
          and b.end_time > new.start_time
    ) then
        raise exception 'This time slot is already booked' using errcode = '23P01';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_prevent_double_booking on public.bookings;
create trigger trg_prevent_double_booking
before insert or update of staff_member_id, booking_date, start_time, end_time, status
on public.bookings
for each row execute function public.prevent_double_booking();

-- -----------------------------------------------------------------------------
-- 8. reviews: authors could re-publish moderated reviews or move them to
--    another business; any staff member could hide any review directly.
--    (The app's report flow uses the service-role client and is unaffected.)
-- -----------------------------------------------------------------------------
drop policy if exists "reviews_report_business_member" on public.reviews;

create or replace function public.protect_review_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_api_caller() or public.is_platform_admin() then
        return new;
    end if;
    if new.status is distinct from old.status
       or new.business_id is distinct from old.business_id
       or new.reviewer_id is distinct from old.reviewer_id then
        raise exception 'Only moderators can change a review''s status or business'
            using errcode = '42501';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_protect_review_update on public.reviews;
create trigger trg_protect_review_update
before update on public.reviews
for each row execute function public.protect_review_update();

-- -----------------------------------------------------------------------------
-- 9. Missing index on a hot foreign key (chat context + hybrid search).
-- -----------------------------------------------------------------------------
create index if not exists idx_ai_knowledge_items_business
    on public.ai_knowledge_items(business_id);
