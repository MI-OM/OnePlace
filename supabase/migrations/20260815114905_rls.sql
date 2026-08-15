-- One Place: Row Level Security. The client is treated as hostile; every
-- policy is scoped to ownership, business membership or public visibility.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.categories enable row level security;
alter table public.business_categories enable row level security;
alter table public.services enable row level security;
alter table public.business_services enable row level security;
alter table public.business_hours enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.voice_sessions enable row level security;
alter table public.service_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.ai_configurations enable row level security;
alter table public.ai_knowledge_items enable row level security;
alter table public.notifications enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles_select_own" on public.profiles
for select to anon, authenticated
using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

create policy "user_roles_select_own" on public.user_roles
for select to authenticated
using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- categories (public read, admin write)
-- ---------------------------------------------------------------------------

create policy "categories_select_public" on public.categories
for select to anon, authenticated
using (is_active = true);

create policy "categories_all_admin" on public.categories
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------

create policy "businesses_select_public" on public.businesses
for select to anon, authenticated
using (status = 'active' and deleted_at is null);

create policy "businesses_select_member" on public.businesses
for select to authenticated
using (public.is_business_member(id));

create policy "businesses_update_member" on public.businesses
for update to authenticated
using (public.is_business_member(id))
with check (public.is_business_member(id));

create policy "businesses_all_admin" on public.businesses
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- business_members
-- ---------------------------------------------------------------------------

create policy "business_members_select_member" on public.business_members
for select to authenticated
using (public.is_business_member(business_id));

create policy "business_members_manage_admin_member" on public.business_members
for insert to authenticated
with check (public.is_business_admin(business_id));

create policy "business_members_update_admin_member" on public.business_members
for update to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

create policy "business_members_all_admin" on public.business_members
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- business_categories (public read, business/admin write)
-- ---------------------------------------------------------------------------

create policy "business_categories_select_public" on public.business_categories
for select to anon, authenticated
using (true);

create policy "business_categories_insert_member" on public.business_categories
for insert to authenticated
with check (public.is_business_member(business_id));

create policy "business_categories_delete_member" on public.business_categories
for delete to authenticated
using (public.is_business_member(business_id));

create policy "business_categories_all_admin" on public.business_categories
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- services (public read, admin write)
-- ---------------------------------------------------------------------------

create policy "services_select_public" on public.services
for select to anon, authenticated
using (is_active = true);

create policy "services_all_admin" on public.services
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- business_services
-- ---------------------------------------------------------------------------

create policy "business_services_select_public" on public.business_services
for select to anon, authenticated
using (is_active = true);

create policy "business_services_all_member" on public.business_services
for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "business_services_all_admin" on public.business_services
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- business_hours
-- ---------------------------------------------------------------------------

create policy "business_hours_select_public" on public.business_hours
for select to anon, authenticated
using (true);

create policy "business_hours_all_member" on public.business_hours
for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "business_hours_all_admin" on public.business_hours
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- availability_exceptions
-- ---------------------------------------------------------------------------

create policy "availability_exceptions_select_public" on public.availability_exceptions
for select to anon, authenticated
using (true);

create policy "availability_exceptions_all_member" on public.availability_exceptions
for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "availability_exceptions_all_admin" on public.availability_exceptions
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------

create policy "favorites_select_own" on public.favorites
for select to authenticated
using (auth.uid() = user_id);

create policy "favorites_insert_own" on public.favorites
for insert to authenticated
with check (auth.uid() = user_id);

create policy "favorites_delete_own" on public.favorites
for delete to authenticated
using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------

create policy "conversations_select_participant" on public.conversations
for select to authenticated
using (
    customer_id = auth.uid()
    or (business_id is not null and public.is_business_member(business_id))
);

create policy "conversations_insert_customer" on public.conversations
for insert to authenticated
with check (
    customer_id = auth.uid()
    and exists (
        select 1 from public.businesses b
        where b.id = business_id and b.status = 'active' and b.deleted_at is null
    )
);

create policy "conversations_update_participant" on public.conversations
for update to authenticated
using (
    customer_id = auth.uid()
    or (business_id is not null and public.is_business_member(business_id))
)
with check (
    customer_id = auth.uid()
    or (business_id is not null and public.is_business_member(business_id))
);

create policy "conversations_all_admin" on public.conversations
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- conversation_participants
-- ---------------------------------------------------------------------------

create policy "conversation_participants_select" on public.conversation_participants
for select to authenticated
using (
    exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (c.customer_id = auth.uid()
               or (c.business_id is not null and public.is_business_member(c.business_id)))
    )
);

create policy "conversation_participants_insert" on public.conversation_participants
for insert to authenticated
with check (
    exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (c.customer_id = auth.uid()
               or (c.business_id is not null and public.is_business_member(c.business_id)))
    )
);

create policy "conversation_participants_all_admin" on public.conversation_participants
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

create policy "messages_select_participant" on public.messages
for select to authenticated
using (
    exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (c.customer_id = auth.uid()
               or (c.business_id is not null and public.is_business_member(c.business_id)))
    )
);

create policy "messages_insert_participant" on public.messages
for insert to authenticated
with check (
    exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (c.customer_id = auth.uid()
               or (c.business_id is not null and public.is_business_member(c.business_id)))
    )
    and sender_user_id = auth.uid()
);

create policy "messages_all_admin" on public.messages
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- voice_sessions
-- ---------------------------------------------------------------------------

create policy "voice_sessions_select_participant" on public.voice_sessions
for select to authenticated
using (
    exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (c.customer_id = auth.uid()
               or (c.business_id is not null and public.is_business_member(c.business_id)))
    )
);

create policy "voice_sessions_insert_participant" on public.voice_sessions
for insert to authenticated
with check (
    exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (c.customer_id = auth.uid()
               or (c.business_id is not null and public.is_business_member(c.business_id)))
    )
);

create policy "voice_sessions_all_admin" on public.voice_sessions
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- service_requests
-- ---------------------------------------------------------------------------

create policy "service_requests_select_related" on public.service_requests
for select to authenticated
using (
    customer_id = auth.uid()
    or (business_id is not null and public.is_business_member(business_id))
);

create policy "service_requests_insert_customer" on public.service_requests
for insert to authenticated
with check (
    customer_id = auth.uid()
    and exists (
        select 1 from public.businesses b
        where b.id = business_id and b.status = 'active' and b.deleted_at is null
    )
);

create policy "service_requests_update_related" on public.service_requests
for update to authenticated
using (
    customer_id = auth.uid()
    or (business_id is not null and public.is_business_member(business_id))
)
with check (
    customer_id = auth.uid()
    or (business_id is not null and public.is_business_member(business_id))
);

create policy "service_requests_all_admin" on public.service_requests
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------

create policy "reviews_select_published" on public.reviews
for select to anon, authenticated
using (status = 'published');

create policy "reviews_select_business" on public.reviews
for select to authenticated
using (public.is_business_member(business_id));

create policy "reviews_insert_reviewer" on public.reviews
for insert to authenticated
with check (reviewer_id = auth.uid());

create policy "reviews_update_own" on public.reviews
for update to authenticated
using (reviewer_id = auth.uid())
with check (reviewer_id = auth.uid());

create policy "reviews_all_admin" on public.reviews
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- ai_configurations (business-scoped)
-- ---------------------------------------------------------------------------

create policy "ai_configurations_select_member" on public.ai_configurations
for select to authenticated
using (public.is_business_member(business_id));

create policy "ai_configurations_insert_member" on public.ai_configurations
for insert to authenticated
with check (public.is_business_member(business_id));

create policy "ai_configurations_update_member" on public.ai_configurations
for update to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "ai_configurations_all_admin" on public.ai_configurations
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- ai_knowledge_items (business-scoped)
-- ---------------------------------------------------------------------------

create policy "ai_knowledge_items_select_member" on public.ai_knowledge_items
for select to authenticated
using (public.is_business_member(business_id));

create policy "ai_knowledge_items_all_member" on public.ai_knowledge_items
for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "ai_knowledge_items_all_admin" on public.ai_knowledge_items
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create policy "notifications_select_own" on public.notifications
for select to authenticated
using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notifications_insert_admin" on public.notifications
for insert to authenticated
with check (public.is_platform_admin() or user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- analytics_events (append from server, business-scoped read)
-- ---------------------------------------------------------------------------

create policy "analytics_events_select_business" on public.analytics_events
for select to authenticated
using (
    user_id = auth.uid()
    or (business_id is not null and public.is_business_member(business_id))
);

create policy "analytics_events_insert_self" on public.analytics_events
for insert to authenticated
with check (user_id = auth.uid());

create policy "analytics_events_all_admin" on public.analytics_events
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- audit_logs (append-oriented, admin read)
-- ---------------------------------------------------------------------------

create policy "audit_logs_select_admin" on public.audit_logs
for select to authenticated
using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

grant select on public.user_roles to authenticated;

grant select on public.categories to anon, authenticated;
grant all on public.categories to authenticated;

grant select on public.businesses to anon, authenticated;
grant update on public.businesses to authenticated;
grant all on public.businesses to authenticated;

grant select on public.business_members to authenticated;
grant insert, update on public.business_members to authenticated;

grant select on public.business_categories to anon, authenticated;
grant insert, delete on public.business_categories to authenticated;

grant select on public.services to anon, authenticated;
grant all on public.services to authenticated;

grant select on public.business_services to anon, authenticated;
grant all on public.business_services to authenticated;

grant select on public.business_hours to anon, authenticated;
grant all on public.business_hours to authenticated;

grant select on public.availability_exceptions to anon, authenticated;
grant all on public.availability_exceptions to authenticated;

grant select, insert, delete on public.favorites to authenticated;

grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.conversation_participants to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert on public.voice_sessions to authenticated;

grant select, insert, update on public.service_requests to authenticated;

grant select on public.reviews to anon, authenticated;
grant select, insert, update on public.reviews to authenticated;

grant select, insert, update on public.ai_configurations to authenticated;
grant select, insert, update, delete on public.ai_knowledge_items to authenticated;

grant select, insert, update on public.notifications to authenticated;

grant select, insert on public.analytics_events to authenticated;

grant select on public.audit_logs to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (messages, conversations, requests, notifications)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.service_requests;
alter publication supabase_realtime add table public.notifications;
