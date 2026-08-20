-- OnePlace: add website builder config to businesses.
alter table public.businesses
  add column if not exists website_template text not null default 'classic'
    check (website_template in ('classic', 'modern', 'minimal')),
  add column if not exists website_primary_color text not null default '#123c3a',
  add column if not exists website_accent_color text not null default '#e7a83b';
