/**
 * Server-only payment logic shared by server actions, pages and the Stripe
 * webhook. NOT a "use server" module: nothing here is callable from the
 * browser. Callers are responsible for authorization.
 */
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";
import {
  CHECKOUT_SESSION_MINUTES,
  appUrl,
  getStripe,
  platformFeeCents,
} from "@/lib/payments/stripe";

export const BOOKING_PAYMENT_COLUMNS = `
  id, business_id, customer_id, service_id, booking_date, start_time, end_time,
  status, customer_name, customer_email, access_token,
  payment_status, payment_kind, amount_due_cents, amount_paid_cents,
  amount_refunded_cents, currency, stripe_account_id,
  stripe_checkout_session_id, stripe_payment_intent_id,
  payment_hold_expires_at, paid_at
`;

export type BookingPaymentRow = {
  id: string;
  business_id: string;
  customer_id: string | null;
  service_id: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  access_token: string;
  payment_status: string;
  payment_kind: "deposit" | "full" | null;
  amount_due_cents: number | null;
  amount_paid_cents: number;
  amount_refunded_cents: number;
  currency: string;
  stripe_account_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_hold_expires_at: string | null;
  paid_at: string | null;
};

export function bookingPagePath(booking: { id: string; access_token: string }) {
  return `/bookings/${booking.id}?t=${booking.access_token}`;
}

async function loadBooking(bookingId: string): Promise<BookingPaymentRow | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("bookings")
    .select(BOOKING_PAYMENT_COLUMNS)
    .eq("id", bookingId)
    .maybeSingle();
  return (data as BookingPaymentRow | null) ?? null;
}

// ─────────────────────────────────────────────
// Checkout
// ─────────────────────────────────────────────

/**
 * Creates a Stripe Checkout Session on the business's connected account for
 * a booking that is awaiting payment, and stores its id on the booking.
 */
export async function createCheckoutForBooking(
  bookingId: string,
): Promise<{ url: string } | { error: string }> {
  const booking = await loadBooking(bookingId);
  if (!booking || booking.payment_status !== "awaiting_payment") {
    return { error: "This booking isn't waiting for payment." };
  }
  if (!booking.stripe_account_id || !booking.amount_due_cents) {
    return { error: "This booking can't be paid online." };
  }

  const service = createServiceClient();
  const [{ data: business }, { data: svc }] = await Promise.all([
    service.from("businesses").select("name").eq("id", booking.business_id).maybeSingle(),
    booking.service_id
      ? service.from("business_services").select("name").eq("id", booking.service_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const label = booking.payment_kind === "deposit" ? "Deposit" : "Payment";
  const when = `${booking.booking_date} at ${booking.start_time.slice(0, 5)}`;
  const fee = platformFeeCents(booking.amount_due_cents);
  const expiresAt = Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_MINUTES * 60;
  const page = bookingPagePath(booking);

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    client_reference_id: booking.id,
    customer_email: booking.customer_email ?? undefined,
    expires_at: expiresAt,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: booking.currency.trim().toLowerCase(),
          unit_amount: booking.amount_due_cents,
          product_data: {
            name: `${label}: ${svc?.name ?? "Appointment"}`,
            description: `${business?.name ?? "Your booking"} · ${when}`,
          },
        },
      },
    ],
    metadata: { booking_id: booking.id },
    payment_intent_data: {
      metadata: { booking_id: booking.id },
      ...(fee > 0 ? { application_fee_amount: fee } : {}),
    },
    success_url: appUrl(`${page}&checkout=success`),
    cancel_url: appUrl(`${page}&checkout=cancelled`),
  };

  try {
    const session = await getStripe().checkout.sessions.create(params, {
      stripeAccount: booking.stripe_account_id,
    });
    await service
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking.id);
    if (!session.url) return { error: "Stripe didn't return a checkout link." };
    return { url: session.url };
  } catch (e) {
    logger.error("stripe checkout create failed", {
      bookingId: booking.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return { error: "We couldn't start the payment. Please try again." };
  }
}

/** Returns the still-open Checkout URL for a booking, if there is one. */
export async function getOpenCheckoutUrl(booking: BookingPaymentRow): Promise<string | null> {
  if (
    booking.payment_status !== "awaiting_payment" ||
    !booking.stripe_checkout_session_id ||
    !booking.stripe_account_id
  ) {
    return null;
  }
  try {
    const session = await getStripe().checkout.sessions.retrieve(
      booking.stripe_checkout_session_id,
      undefined,
      { stripeAccount: booking.stripe_account_id },
    );
    return session.status === "open" ? session.url : null;
  } catch {
    return null;
  }
}

/**
 * Re-reads a booking's Checkout Session from Stripe and applies it. Pages use
 * this so a customer returning from Checkout sees "paid" even if the
 * webhook hasn't arrived yet.
 */
export async function syncBookingCheckout(booking: BookingPaymentRow): Promise<void> {
  if (
    booking.payment_status !== "awaiting_payment" ||
    !booking.stripe_checkout_session_id ||
    !booking.stripe_account_id
  ) {
    return;
  }
  try {
    const session = await getStripe().checkout.sessions.retrieve(
      booking.stripe_checkout_session_id,
      undefined,
      { stripeAccount: booking.stripe_account_id },
    );
    await applyCheckoutSession(session);
  } catch (e) {
    logger.warn("stripe checkout sync failed", {
      bookingId: booking.id,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Applies a Checkout Session's state (paid / expired) to its booking. */
export async function applyCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const bookingId = session.metadata?.booking_id ?? session.client_reference_id;
  if (!bookingId) return;
  const booking = await loadBooking(bookingId);
  if (!booking || booking.stripe_checkout_session_id !== session.id) return;

  if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
    await markBookingPaid(booking, session);
  } else if (session.status === "expired") {
    await releaseUnpaidBooking(booking, "expired");
  }
}

async function markBookingPaid(booking: BookingPaymentRow, session: Stripe.Checkout.Session) {
  if (booking.payment_status !== "awaiting_payment") return;
  const service = createServiceClient();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const { data: updated } = await service
    .from("bookings")
    .update({
      payment_status: "paid",
      amount_paid_cents: session.amount_total ?? booking.amount_due_cents ?? 0,
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
      payment_hold_expires_at: null,
      // Paying holds the slot for real: confirm it.
      status: booking.status === "pending" ? "confirmed" : booking.status,
    })
    .eq("id", booking.id)
    .eq("payment_status", "awaiting_payment")
    .select("id");
  if (!updated || updated.length === 0) return; // someone else applied it

  await notifyBusinessMembers(booking.business_id, {
    type: "booking_paid",
    title: "New paid booking",
    body: `${booking.customer_name ?? "A customer"} paid for ${booking.booking_date} at ${booking.start_time.slice(0, 5)}.`,
    data: { businessId: booking.business_id, bookingId: booking.id },
  });
}

/** Cancels an unpaid hold (checkout expired, failed or abandoned). */
export async function releaseUnpaidBooking(
  booking: BookingPaymentRow,
  reason: "expired" | "failed",
): Promise<void> {
  if (booking.payment_status !== "awaiting_payment") return;
  const service = createServiceClient();
  await service
    .from("bookings")
    .update({ payment_status: reason, status: "cancelled", payment_hold_expires_at: null })
    .eq("id", booking.id)
    .eq("payment_status", "awaiting_payment");
}

/**
 * Cancels a booking that's still waiting for payment: expires its Checkout
 * Session so it can't be paid afterwards, then releases the slot.
 */
export async function cancelUnpaidBooking(booking: BookingPaymentRow): Promise<void> {
  if (booking.stripe_checkout_session_id && booking.stripe_account_id) {
    try {
      await getStripe().checkout.sessions.expire(
        booking.stripe_checkout_session_id,
        undefined,
        { stripeAccount: booking.stripe_account_id },
      );
    } catch {
      // Already expired or completed; the sync below handles "completed".
    }
    await syncBookingCheckout(booking);
    const fresh = await loadBooking(booking.id);
    if (fresh?.payment_status === "paid") {
      // Paid at the last second: refund instead.
      await refundBookingPayment(fresh);
      return;
    }
  }
  await releaseUnpaidBooking(booking, "expired");
}

// ─────────────────────────────────────────────
// Refunds
// ─────────────────────────────────────────────

/** Refunds whatever is left of a booking's payment. Returns refunded cents. */
export async function refundBookingPayment(
  booking: BookingPaymentRow,
): Promise<{ refundedCents: number } | { error: string }> {
  const remaining = booking.amount_paid_cents - booking.amount_refunded_cents;
  if (remaining <= 0 || !booking.stripe_payment_intent_id || !booking.stripe_account_id) {
    return { refundedCents: 0 };
  }
  try {
    await getStripe().refunds.create(
      {
        payment_intent: booking.stripe_payment_intent_id,
        amount: remaining,
        ...(platformFeeCents(booking.amount_paid_cents) > 0
          ? { refund_application_fee: true }
          : {}),
        metadata: { booking_id: booking.id },
      },
      {
        stripeAccount: booking.stripe_account_id,
        idempotencyKey: `booking-refund-${booking.id}-${booking.amount_refunded_cents}`,
      },
    );
  } catch (e) {
    logger.error("stripe refund failed", {
      bookingId: booking.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return { error: "The refund didn't go through. Please try again or refund it in Stripe." };
  }

  const service = createServiceClient();
  await service
    .from("bookings")
    .update({ amount_refunded_cents: booking.amount_paid_cents, payment_status: "refunded" })
    .eq("id", booking.id);
  return { refundedCents: remaining };
}

/** Syncs refunds made anywhere (including the business's Stripe dashboard). */
export async function applyChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;
  const service = createServiceClient();
  const fully = charge.amount_refunded >= charge.amount;
  await service
    .from("bookings")
    .update({
      amount_refunded_cents: charge.amount_refunded,
      payment_status: fully ? "refunded" : "partially_refunded",
    })
    .eq("stripe_payment_intent_id", paymentIntentId);
}

// ─────────────────────────────────────────────
// Connected accounts
// ─────────────────────────────────────────────

/** Pulls a connected account from Stripe and stores its state. */
export async function syncStripeAccount(stripeAccountId: string): Promise<Stripe.Account> {
  const account = await getStripe().accounts.retrieve(stripeAccountId);
  await applyAccountState(account);
  return account;
}

export async function applyAccountState(account: Stripe.Account): Promise<void> {
  const service = createServiceClient();
  await service
    .from("businesses")
    .update({
      stripe_charges_enabled: Boolean(account.charges_enabled),
      stripe_details_submitted: Boolean(account.details_submitted),
    })
    .eq("stripe_account_id", account.id);
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

async function notifyBusinessMembers(
  businessId: string,
  n: { type: string; title: string; body: string; data: Record<string, unknown> },
) {
  const service = createServiceClient();
  const { data: members } = await service
    .from("business_members")
    .select("user_id")
    .eq("business_id", businessId)
    .eq("status", "active");
  if (!members?.length) return;
  await service.from("notifications").insert(
    members.map((m) => ({ user_id: m.user_id, ...n })),
  );
}
