-- Phase 1: Bug fixes for verification and review systems

-- 1. Add verified_at column to businesses (referenced by admin-actions.ts but never created)
alter table public.businesses
  add column if not exists verified_at timestamptz;

-- 2. Add moderated_at column to reviews (referenced by admin-actions.ts but never created)
alter table public.reviews
  add column if not exists moderated_at timestamptz;

-- 3. Add reported_at and reported_by to reviews for the report mechanism
alter table public.reviews
  add column if not exists reported_at timestamptz,
  add column if not exists reported_by uuid references public.profiles(id) on delete set null,
  add column if not exists report_reason text;

-- 4. Index for finding reported reviews quickly
create index if not exists idx_reviews_status on public.reviews(status) where status = 'hidden';

-- 5. Reviews auto-publish: change RLS INSERT policy to allow status = 'published'
--    (Previously forced status = 'pending' which required manual admin moderation)
drop policy if exists "reviews_insert_reviewer" on public.reviews;

create policy "reviews_insert_reviewer" on public.reviews
for insert to authenticated
with check (
    reviewer_id = auth.uid()
    and status = 'published'
);

-- 6. Allow business owners to report reviews (set status to 'hidden')
--    This is done via a server action using service client (bypasses RLS)
--    but we also add an UPDATE policy for business members to set hidden status
create policy "reviews_report_business_member" on public.reviews
for update to authenticated
using (
    exists (
        select 1 from public.business_members bm
        where bm.business_id = reviews.business_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
    )
)
with check (
    status = 'hidden'
);
