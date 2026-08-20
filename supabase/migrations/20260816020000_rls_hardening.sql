-- L1: RLS Hardening + Data Minimization
-- Fixes critical and high-priority security gaps identified in audit.

-- ---------------------------------------------------------------------------
-- 1. Reviews: force status='pending' on INSERT for non-admins, restrict
--    UPDATE to only allow status changes by admins (I2 moderation flow).
-- ---------------------------------------------------------------------------

-- Replace the permissive INSERT policy with one that forces pending status.
drop policy if exists "reviews_insert_reviewer" on public.reviews;

create policy "reviews_insert_reviewer" on public.reviews
for insert to authenticated
with check (
    reviewer_id = auth.uid()
    and status = 'pending'
);

-- Replace the permissive UPDATE policy: only admins can change review status.
drop policy if exists "reviews_update_own" on public.reviews;

create policy "reviews_update_own" on public.reviews
for update to authenticated
using (reviewer_id = auth.uid())
with check (reviewer_id = auth.uid());

create policy "reviews_update_admin" on public.reviews
for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 2. Business services / hours / availability exceptions: restrict DELETE
--    and full management to owner/manager, not all staff.
-- ---------------------------------------------------------------------------

drop policy if exists "business_services_all_member" on public.business_services;

create policy "business_services_all_member" on public.business_services
for all to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

drop policy if exists "business_hours_all_member" on public.business_hours;

create policy "business_hours_all_member" on public.business_hours
for all to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

drop policy if exists "availability_exceptions_all_member" on public.availability_exceptions;

create policy "availability_exceptions_all_member" on public.availability_exceptions
for all to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

-- ---------------------------------------------------------------------------
-- 3. AI knowledge items: restrict management to owner/manager.
-- ---------------------------------------------------------------------------

drop policy if exists "ai_knowledge_items_all_member" on public.ai_knowledge_items;

create policy "ai_knowledge_items_all_member" on public.ai_knowledge_items
for all to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

-- ---------------------------------------------------------------------------
-- 4. Analytics events: validate business_id on INSERT to prevent pollution.
-- ---------------------------------------------------------------------------

drop policy if exists "analytics_events_insert_self" on public.analytics_events;

create policy "analytics_events_insert_self" on public.analytics_events
for insert to authenticated
with check (
    user_id = auth.uid()
    and (
        business_id is null
        or exists (
            select 1 from public.businesses b
            where b.id = business_id and b.status = 'active' and b.deleted_at is null
        )
    )
);
