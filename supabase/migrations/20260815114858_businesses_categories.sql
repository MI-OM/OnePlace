-- One Place: business domain (businesses, members, categories).

create table public.businesses (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    slug text not null unique,

    description text,

    logo_url text,

    cover_image_url text,

    phone text,

    email text,

    website_url text,

    address_line_1 text,
    address_line_2 text,
    city text,
    province text,
    postal_code text,
    country text,

    latitude numeric(10,7),
    longitude numeric(10,7),

    timezone text not null default 'America/St_Johns',

    status text not null default 'draft'
        check (
            status in (
                'draft',
                'pending_review',
                'active',
                'suspended',
                'archived'
            )
        ),

    verification_status text not null default 'unverified'
        check (
            verification_status in (
                'unverified',
                'pending',
                'verified'
            )
        ),

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create table public.business_members (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    role text not null
        check (
            role in (
                'owner',
                'manager',
                'staff'
            )
        ),

    status text not null default 'active'
        check (
            status in (
                'invited',
                'active',
                'suspended',
                'removed'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique(business_id, user_id)
);

create trigger business_members_set_updated_at
before update on public.business_members
for each row execute function public.set_updated_at();

create table public.categories (
    id uuid primary key default gen_random_uuid(),

    parent_id uuid
        references public.categories(id)
        on delete set null,

    name text not null,

    slug text not null unique,

    description text,

    icon text,

    is_active boolean not null default true,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create table public.business_categories (
    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    category_id uuid not null
        references public.categories(id)
        on delete cascade,

    is_primary boolean not null default false,

    created_at timestamptz not null default now(),

    primary key (business_id, category_id)
);

-- Determine whether the caller is a member of a business.
create or replace function public.is_business_member(business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.business_members bm
        where bm.business_id = is_business_member.business_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
    );
$$;

-- Determine whether the caller has owner/manager privileges on a business.
create or replace function public.is_business_admin(business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.business_members bm
        where bm.business_id = is_business_admin.business_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
          and bm.role in ('owner', 'manager')
    );
$$;
