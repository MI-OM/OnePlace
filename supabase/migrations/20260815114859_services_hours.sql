-- One Place: services, business services, hours and availability exceptions.

create table public.services (
    id uuid primary key default gen_random_uuid(),

    category_id uuid
        references public.categories(id)
        on delete set null,

    name text not null,

    description text,

    duration_minutes integer,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create table public.business_services (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    service_id uuid
        references public.services(id)
        on delete set null,

    name text not null,

    description text,

    price numeric(12,2),

    currency char(3) not null default 'CAD',

    price_type text not null default 'fixed'
        check (
            price_type in (
                'fixed',
                'starting_from',
                'range',
                'quote_required'
            )
        ),

    min_price numeric(12,2),
    max_price numeric(12,2),

    duration_minutes integer,

    booking_required boolean not null default false,

    is_active boolean not null default true,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger business_services_set_updated_at
before update on public.business_services
for each row execute function public.set_updated_at();

create table public.business_hours (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    day_of_week smallint not null
        check (day_of_week between 0 and 6),

    is_closed boolean not null default false,

    opens_at time,

    closes_at time,

    created_at timestamptz not null default now(),

    unique(business_id, day_of_week)
);

create table public.availability_exceptions (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    exception_date date not null,

    is_closed boolean not null default true,

    opens_at time,

    closes_at time,

    reason text,

    created_at timestamptz not null default now(),

    unique(business_id, exception_date)
);
