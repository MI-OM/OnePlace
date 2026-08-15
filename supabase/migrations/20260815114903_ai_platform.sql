-- One Place: AI configuration, knowledge, and platform tables
-- (notifications, analytics events, audit logs).

create table public.ai_configurations (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null unique
        references public.businesses(id)
        on delete cascade,

    enabled boolean not null default false,

    greeting text,

    personality text,

    instructions text,

    escalation_enabled boolean not null default true,

    escalation_message text,

    handoff_enabled boolean not null default true,

    language text not null default 'en',

    model_provider text,

    model_name text,

    configuration jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger ai_configurations_set_updated_at
before update on public.ai_configurations
for each row execute function public.set_updated_at();

create table public.ai_knowledge_items (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    title text not null,

    content text not null,

    category text,

    source_url text,

    priority integer not null default 0,

    is_active boolean not null default true,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger ai_knowledge_items_set_updated_at
before update on public.ai_knowledge_items
for each row execute function public.set_updated_at();

create table public.notifications (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    type text not null,

    title text not null,

    body text not null,

    data jsonb not null default '{}'::jsonb,

    read_at timestamptz,

    created_at timestamptz not null default now()
);

create table public.analytics_events (
    id uuid primary key default gen_random_uuid(),

    user_id uuid
        references public.profiles(id)
        on delete set null,

    business_id uuid
        references public.businesses(id)
        on delete set null,

    session_id text,

    event_name text not null,

    event_category text,

    properties jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);

create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),

    actor_user_id uuid
        references public.profiles(id)
        on delete set null,

    business_id uuid
        references public.businesses(id)
        on delete set null,

    action text not null,

    entity_type text,

    entity_id uuid,

    old_values jsonb,

    new_values jsonb,

    ip_address inet,

    user_agent text,

    created_at timestamptz not null default now()
);
