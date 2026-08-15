-- One Place: communication domain (conversations, participants, messages,
-- voice sessions) and favorites.

create table public.conversations (
    id uuid primary key default gen_random_uuid(),

    business_id uuid
        references public.businesses(id)
        on delete set null,

    customer_id uuid
        references public.profiles(id)
        on delete set null,

    type text not null default 'customer_business'
        check (
            type in (
                'customer_business',
                'customer_support'
            )
        ),

    status text not null default 'active'
        check (
            status in (
                'active',
                'closed',
                'archived'
            )
        ),

    source text not null default 'web'
        check (
            source in (
                'web',
                'voice',
                'phone'
            )
        ),

    started_at timestamptz not null default now(),
    ended_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create table public.conversation_participants (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null
        references public.conversations(id)
        on delete cascade,

    user_id uuid
        references public.profiles(id)
        on delete set null,

    participant_type text not null
        check (
            participant_type in (
                'customer',
                'business_staff',
                'ai_agent',
                'system'
            )
        ),

    joined_at timestamptz not null default now(),
    left_at timestamptz
);

create table public.messages (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null
        references public.conversations(id)
        on delete cascade,

    sender_user_id uuid
        references public.profiles(id)
        on delete set null,

    sender_type text not null
        check (
            sender_type in (
                'customer',
                'business_staff',
                'ai_agent',
                'system'
            )
        ),

    message_type text not null default 'text'
        check (
            message_type in (
                'text',
                'system',
                'file',
                'voice'
            )
        ),

    content text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);

create table public.voice_sessions (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null
        references public.conversations(id)
        on delete cascade,

    livekit_room_name text,

    status text not null default 'created'
        check (
            status in (
                'created',
                'connecting',
                'active',
                'ended',
                'failed'
            )
        ),

    started_at timestamptz,

    ended_at timestamptz,

    duration_seconds integer,

    participant_count integer not null default 0,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);

create table public.favorites (
    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    primary key(user_id, business_id)
);
