-- RLS + grants for staff availability and specialties

alter table public.staff_availability enable row level security;
alter table public.staff_specialties enable row level security;

-- staff_availability: staff can manage their own schedule, owners/managers can view all
create policy "staff_availability_select_member"
on public.staff_availability
for select
using (
    exists (
        select 1 from public.business_members bm
        where bm.id = staff_availability.staff_member_id
          and bm.status = 'active'
    )
);

create policy "staff_availability_insert_member"
on public.staff_availability
for insert
with check (
    exists (
        select 1 from public.business_members bm
        where bm.id = staff_availability.staff_member_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
    )
);

create policy "staff_availability_update_member"
on public.staff_availability
for update
using (
    exists (
        select 1 from public.business_members bm
        where bm.id = staff_availability.staff_member_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
    )
);

create policy "staff_availability_delete_member"
on public.staff_availability
for delete
using (
    exists (
        select 1 from public.business_members bm
        where bm.id = staff_availability.staff_member_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
          and bm.role in ('owner', 'manager')
    )
);

-- staff_specialties: same pattern
create policy "staff_specialties_select_member"
on public.staff_specialties
for select
using (
    exists (
        select 1 from public.business_members bm
        where bm.id = staff_specialties.staff_member_id
          and bm.status = 'active'
    )
);

create policy "staff_specialties_insert_member"
on public.staff_specialties
for insert
with check (
    exists (
        select 1 from public.business_members bm
        where bm.id = staff_specialties.staff_member_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
    )
);

create policy "staff_specialties_delete_member"
on public.staff_specialties
for delete
using (
    exists (
        select 1 from public.business_members bm
        where bm.id = staff_specialties.staff_member_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
          and bm.role in ('owner', 'manager')
    )
);

-- Grants
grant select, insert, update, delete on public.staff_availability to authenticated;
grant select, insert, delete on public.staff_specialties to authenticated;
