-- One Place: M3 chat/AI support.
-- 1. Extend conversation statuses to the Doc 13 state machine.
-- 2. Seed AI configuration (enabled) for active businesses.
-- 3. Seed knowledge items (FAQs/policies) so the assistant is grounded.

-- ---------------------------------------------------------------------------
-- 1. Conversation statuses
-- ---------------------------------------------------------------------------

alter table public.conversations
    drop constraint conversations_status_check;

alter table public.conversations
    add constraint conversations_status_check
    check (
        status in (
            'new',
            'active',
            'waiting',
            'human_requested',
            'human_connected',
            'closed',
            'failed',
            'archived'
        )
    );

-- ---------------------------------------------------------------------------
-- 2. Seed AI configurations for active businesses
-- ---------------------------------------------------------------------------

insert into public.ai_configurations (
    business_id,
    enabled,
    greeting,
    personality,
    escalation_enabled,
    escalation_message,
    handoff_enabled,
    language,
    model_provider,
    model_name
)
select
    b.id,
    true,
    'Hi! You''re chatting with ' || b.name || '. What can we help you with?',
    'friendly, professional, concise',
    true,
    'I''m connecting you with someone from the team now.',
    true,
    'en',
    'openai',
    'gpt-4o-mini'
from public.businesses b
where b.status = 'active' and b.deleted_at is null;

-- ---------------------------------------------------------------------------
-- 3. Seed knowledge items (FAQs / policies) for active businesses
-- ---------------------------------------------------------------------------

insert into public.ai_knowledge_items (business_id, title, content, category, priority, is_active)
select b.id, 'Booking', 'We recommend booking appointments in advance. You can reach us by phone or email, or ask here and we''ll point you in the right direction.', 'policy', 1, true
from public.businesses b where b.status = 'active' and b.deleted_at is null;

insert into public.ai_knowledge_items (business_id, title, content, category, priority, is_active)
select b.id, 'Cancellation', 'Please give us at least 24 hours'' notice to change or cancel an appointment so we can offer the time to someone else.', 'policy', 2, true
from public.businesses b where b.status = 'active' and b.deleted_at is null;

insert into public.ai_knowledge_items (business_id, title, content, category, priority, is_active)
select b.id, 'Payments', 'We accept major credit cards and debit at the time of service.', 'policy', 3, true
from public.businesses b where b.status = 'active' and b.deleted_at is null;

-- ---------------------------------------------------------------------------
-- 4. Service-role grants
-- ---------------------------------------------------------------------------
-- The chat/AI server code uses the service-role client to read grounded
-- business context and to insert ai_agent/system messages (no RLS sender
-- user exists for those rows).

grant select on public.businesses to service_role;
grant select on public.business_services to service_role;
grant select on public.business_hours to service_role;
grant select on public.ai_configurations to service_role;
grant select on public.ai_knowledge_items to service_role;
grant select, insert on public.messages to service_role;
grant select, insert, update on public.conversations to service_role;
