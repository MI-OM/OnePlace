-- One Place: service requests and reviews.

create table public.service_requests (
    id uuid primary key default gen_random_uuid(),

    customer_id uuid
        references public.profiles(id)
        on delete set null,

    business_id uuid
        references public.businesses(id)
        on delete set null,

    conversation_id uuid
        references public.conversations(id)
        on delete set null,

    business_service_id uuid
        references public.business_services(id)
        on delete set null,

    request_type text not null
        check (
            request_type in (
                'information',
                'availability',
                'quote',
                'booking',
                'callback',
                'other'
            )
        ),

    status text not null default 'open'
        check (
            status in (
                'open',
                'in_progress',
                'completed',
                'cancelled',
                'expired'
            )
        ),

    notes text,

    requested_date date,

    requested_time time,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger service_requests_set_updated_at
before update on public.service_requests
for each row execute function public.set_updated_at();

create table public.reviews (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    reviewer_id uuid not null
        references public.profiles(id)
        on delete cascade,

    service_request_id uuid
        references public.service_requests(id)
        on delete set null,

    rating smallint not null
        check (rating between 1 and 5),

    title text,

    body text,

    status text not null default 'published'
        check (
            status in (
                'pending',
                'published',
                'hidden',
                'removed'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();
