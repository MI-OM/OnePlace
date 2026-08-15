-- One Place: identity domain (profiles, user_roles) + helper functions.

-- Generic updated_at trigger function.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create a profile row and default customer role for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    display_name text,
    first_name text,
    last_name text,

    avatar_url text,

    bio text,

    phone text,

    timezone text,

    locale text not null default 'en',

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    role text not null
        check (
            role in (
                'customer',
                'business_owner',
                'business_staff',
                'platform_admin'
            )
        ),

    created_at timestamptz not null default now(),

    unique(user_id, role)
);

-- Determine whether the caller is a platform administrator.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'platform_admin'
    );
$$;
