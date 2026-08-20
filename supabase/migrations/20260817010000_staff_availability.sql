-- Phase 1: Staff availability and scheduling

create table public.staff_availability (
    id uuid primary key default gen_random_uuid(),

    staff_member_id uuid not null
        references public.business_members(id)
        on delete cascade,

    day_of_week integer not null
        check (day_of_week >= 0 and day_of_week <= 6),

    start_time time not null default '09:00',

    end_time time not null default '17:00',

    is_available boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique(staff_member_id, day_of_week)
);

create trigger staff_availability_set_updated_at
before update on public.staff_availability
for each row execute function public.set_updated_at();

create index idx_staff_availability_member on public.staff_availability(staff_member_id);

-- Staff specialties: which service categories a staff member handles
create table public.staff_specialties (
    id uuid primary key default gen_random_uuid(),

    staff_member_id uuid not null
        references public.business_members(id)
        on delete cascade,

    service_id uuid not null
        references public.services(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    unique(staff_member_id, service_id)
);

create index idx_staff_specialties_member on public.staff_specialties(staff_member_id);
