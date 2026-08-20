-- Featured and sponsored businesses

-- 1. Add is_featured column (admin-curated)
alter table public.businesses
  add column if not exists is_featured boolean not null default false;

-- 2. Add is_sponsored column (paid priority placement)
alter table public.businesses
  add column if not exists is_sponsored boolean not null default false;

-- 3. Add sponsored_at for tracking sponsorship start
alter table public.businesses
  add column if not exists sponsored_at timestamptz;

-- 4. Index for quick featured/sponsored lookups
create index if not exists idx_businesses_featured on public.businesses(id) where is_featured = true and status = 'active';
create index if not exists idx_businesses_sponsored on public.businesses(id) where is_sponsored = true and status = 'active';
