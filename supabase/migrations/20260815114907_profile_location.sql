-- One Place: add customer-facing profile fields (Doc 12 — Customer Profile).

alter table public.profiles
    add column if not exists location text;
