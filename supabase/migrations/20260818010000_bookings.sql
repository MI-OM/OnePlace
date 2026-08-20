-- Phase 1: Bookings

create table public.bookings (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id) on delete cascade,

    customer_id uuid
        references auth.users(id) on delete set null,

    service_id uuid
        references public.business_services(id) on delete set null,

    staff_member_id uuid
        references public.business_members(id) on delete set null,

    booking_date date not null,

    start_time time not null,

    end_time time not null,

    status text not null default 'pending'
        check (status in (
            'pending',
            'confirmed',
            'cancelled',
            'completed',
            'no_show'
        )),

    notes text,

    customer_name text,
    customer_email text,
    customer_phone text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create index idx_bookings_business_date on public.bookings(business_id, booking_date);
create index idx_bookings_staff_date on public.bookings(staff_member_id, booking_date);
create index idx_bookings_customer on public.bookings(customer_id);

-- RLS

alter table public.bookings enable row level security;

-- Business members can read/write bookings for their business
create policy "business_bookings_all"
on public.bookings
for all
using (
    exists (
        select 1 from public.business_members
        where business_members.business_id = bookings.business_id
        and business_members.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1 from public.business_members
        where business_members.business_id = bookings.business_id
        and business_members.user_id = auth.uid()
    )
);

-- Customers can read their own bookings
create policy "customer_bookings_read"
on public.bookings
for select
using (customer_id = auth.uid());

-- Customers can insert bookings (with their own user id)
create policy "customer_bookings_insert"
on public.bookings
for insert
with check (customer_id = auth.uid());

-- Customers can cancel their own bookings
create policy "customer_bookings_update"
on public.bookings
for update
using (customer_id = auth.uid())
with check (customer_id = auth.uid());
