-- =============================================================================
-- Phase 3: booking payments via Stripe Connect (direct charges).
--
-- Each business connects its own Stripe account; customers pay that account
-- directly through Stripe Checkout. One Place takes no fee by default
-- (STRIPE_PLATFORM_FEE_PERCENT) and never holds funds.
--
-- Payment columns are written only by the server (service role) and the
-- Stripe webhook. API callers cannot change them (see triggers below).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Businesses: connected Stripe account + cancellation policy
-- -----------------------------------------------------------------------------
alter table public.businesses
    add column if not exists stripe_account_id text unique,
    add column if not exists stripe_charges_enabled boolean not null default false,
    add column if not exists stripe_details_submitted boolean not null default false,
    add column if not exists cancellation_window_hours integer not null default 24
        check (cancellation_window_hours between 0 and 720);

-- -----------------------------------------------------------------------------
-- Services: how (and whether) customers pay online when booking
-- -----------------------------------------------------------------------------
alter table public.business_services
    add column if not exists payment_mode text not null default 'none'
        check (payment_mode in ('none', 'deposit', 'full')),
    add column if not exists deposit_amount numeric(12,2)
        check (deposit_amount is null or deposit_amount > 0);

-- -----------------------------------------------------------------------------
-- Bookings: payment state
-- -----------------------------------------------------------------------------
alter table public.bookings
    add column if not exists payment_status text not null default 'not_required'
        check (payment_status in (
            'not_required', 'awaiting_payment', 'paid',
            'partially_refunded', 'refunded', 'expired', 'failed'
        )),
    add column if not exists payment_kind text
        check (payment_kind is null or payment_kind in ('deposit', 'full')),
    add column if not exists amount_due_cents integer check (amount_due_cents is null or amount_due_cents >= 0),
    add column if not exists amount_paid_cents integer not null default 0,
    add column if not exists amount_refunded_cents integer not null default 0,
    add column if not exists currency char(3) not null default 'CAD',
    add column if not exists stripe_account_id text,
    add column if not exists stripe_checkout_session_id text unique,
    add column if not exists stripe_payment_intent_id text,
    add column if not exists payment_hold_expires_at timestamptz,
    add column if not exists paid_at timestamptz,
    -- Lets guests (no account) open their own booking page from the link
    -- they get after checkout.
    add column if not exists access_token uuid not null default gen_random_uuid();

create index if not exists idx_bookings_payment_intent
    on public.bookings(stripe_payment_intent_id)
    where stripe_payment_intent_id is not null;

create index if not exists idx_bookings_awaiting_payment
    on public.bookings(payment_hold_expires_at)
    where payment_status = 'awaiting_payment';

-- -----------------------------------------------------------------------------
-- Webhook idempotency: each Stripe event is processed once.
-- Service role only (RLS on, no policies).
-- -----------------------------------------------------------------------------
create table if not exists public.stripe_events (
    id text primary key,
    type text not null,
    account text,
    received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
grant all on public.stripe_events to service_role;

-- -----------------------------------------------------------------------------
-- RLS: bookings are created only through the server (which validates the
-- slot and starts checkout). A direct customer insert could skip payment.
-- -----------------------------------------------------------------------------
drop policy if exists "customer_bookings_insert" on public.bookings;

-- -----------------------------------------------------------------------------
-- Protect payment columns from every API caller (customers and staff).
-- -----------------------------------------------------------------------------
create or replace function public.protect_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_api_caller() or public.is_platform_admin() then
        return new;
    end if;

    if (new.payment_status, new.payment_kind, new.amount_due_cents,
        new.amount_paid_cents, new.amount_refunded_cents, new.currency,
        new.stripe_account_id, new.stripe_checkout_session_id,
        new.stripe_payment_intent_id, new.payment_hold_expires_at,
        new.paid_at, new.access_token)
       is distinct from
       (old.payment_status, old.payment_kind, old.amount_due_cents,
        old.amount_paid_cents, old.amount_refunded_cents, old.currency,
        old.stripe_account_id, old.stripe_checkout_session_id,
        old.stripe_payment_intent_id, old.payment_hold_expires_at,
        old.paid_at, old.access_token) then
        raise exception 'Payment details can only be changed by the payment system'
            using errcode = '42501';
    end if;

    if public.is_business_member(old.business_id) then
        return new;
    end if;

    -- Customer path: only the status may change (to cancelled, per policy).
    if (new.business_id, new.service_id, new.staff_member_id, new.booking_date,
        new.start_time, new.end_time, new.customer_id)
       is distinct from
       (old.business_id, old.service_id, old.staff_member_id, old.booking_date,
        old.start_time, old.end_time, old.customer_id) then
        raise exception 'Customers can only cancel a booking' using errcode = '42501';
    end if;
    return new;
end;
$$;

-- Stripe connection flags are set by the server from Stripe, never by users.
create or replace function public.protect_business_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_api_caller() or public.is_platform_admin() then
        return new;
    end if;
    if new.status is distinct from old.status
       or new.verification_status is distinct from old.verification_status
       or new.is_featured is distinct from old.is_featured
       or new.is_sponsored is distinct from old.is_sponsored
       or new.slug is distinct from old.slug
       or new.embedding is distinct from old.embedding
       or new.stripe_account_id is distinct from old.stripe_account_id
       or new.stripe_charges_enabled is distinct from old.stripe_charges_enabled
       or new.stripe_details_submitted is distinct from old.stripe_details_submitted then
        raise exception 'Only platform admins can change status, verification, featured, sponsored, slug, embedding or payment account'
            using errcode = '42501';
    end if;
    return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Double-booking guard: an unpaid hold stops blocking the slot once its
-- checkout window has passed, even if the expiry webhook is late.
-- -----------------------------------------------------------------------------
create or replace function public.prevent_double_booking()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if new.end_time <= new.start_time then
        raise exception 'Booking must end after it starts' using errcode = '23514';
    end if;
    if new.staff_member_id is null or new.status not in ('pending', 'confirmed') then
        return new;
    end if;

    perform pg_advisory_xact_lock(
        hashtext(new.staff_member_id::text || ':' || new.booking_date::text)
    );

    if exists (
        select 1 from public.bookings b
        where b.staff_member_id = new.staff_member_id
          and b.booking_date = new.booking_date
          and b.status in ('pending', 'confirmed')
          and not (b.payment_status = 'awaiting_payment'
                   and b.payment_hold_expires_at < now())
          and b.id is distinct from new.id
          and b.start_time < new.end_time
          and b.end_time > new.start_time
    ) then
        raise exception 'This time slot is already booked' using errcode = '23P01';
    end if;
    return new;
end;
$$;
