"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getUser } from "@/lib/auth";
import { AuthzError, BUSINESS_ADMIN_ROLES, requireBusinessRole } from "@/lib/authz";
import { logger } from "@/lib/logger";
import { appUrl, getStripe, isStripeConfigured, toCents } from "@/lib/payments/stripe";
import {
  BOOKING_PAYMENT_COLUMNS,
  cancelUnpaidBooking,
  syncStripeAccount,
  getOpenCheckoutUrl,
  refundBookingPayment,
  type BookingPaymentRow,
} from "@/lib/payments/core";
import { cancellationDeadline } from "@/lib/payments/queries";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function failure(e: unknown, fallback: string): { ok: false; error: string } {
  if (e instanceof AuthzError) return { ok: false, error: e.message };
  logger.error(fallback, { error: e instanceof Error ? e.message : String(e) });
  return { ok: false, error: fallback };
}

// ─────────────────────────────────────────────
// Business: connect Stripe
// ─────────────────────────────────────────────

/**
 * Creates (once) the business's connected Stripe account and returns a
 * Stripe-hosted onboarding link. Owners only: this decides where money goes.
 */
export async function startStripeOnboarding(businessId: string): Promise<Result<{ url: string }>> {
  try {
    await requireBusinessRole(businessId, ["owner"]);
    if (!isStripeConfigured()) {
      return { ok: false, error: "Online payments aren't switched on for One Place yet." };
    }
    const service = createServiceClient();
    const { data: business } = await service
      .from("businesses")
      .select("id, name, slug, email, stripe_account_id")
      .eq("id", businessId)
      .maybeSingle();
    if (!business) return { ok: false, error: "Business not found." };

    const stripe = getStripe();
    let accountId = business.stripe_account_id as string | null;

    if (!accountId) {
      // Standard-style account: the business gets the full Stripe dashboard,
      // pays its own Stripe fees and handles its own disputes.
      const params: Stripe.AccountCreateParams = {
        country: "CA",
        email: business.email ?? undefined,
        business_profile: {
          name: business.name,
          url: appUrl(`/businesses/${business.slug}`),
        },
        controller: {
          fees: { payer: "account" },
          losses: { payments: "stripe" },
          stripe_dashboard: { type: "full" },
          requirement_collection: "stripe",
        },
        metadata: { business_id: business.id },
      };
      const account = await stripe.accounts.create(params, {
        idempotencyKey: `connect-account-${business.id}`,
      });

      // Only the first writer wins if two owners click at once.
      const { data: saved } = await service
        .from("businesses")
        .update({ stripe_account_id: account.id })
        .eq("id", businessId)
        .is("stripe_account_id", null)
        .select("stripe_account_id");
      if (saved && saved.length > 0) {
        accountId = account.id;
      } else {
        const { data: current } = await service
          .from("businesses")
          .select("stripe_account_id")
          .eq("id", businessId)
          .maybeSingle();
        accountId = current?.stripe_account_id ?? account.id;
      }
    }

    const link = await stripe.accountLinks.create({
      account: accountId!,
      type: "account_onboarding",
      refresh_url: appUrl(`/dashboard/${businessId}/payments?stripe=refresh`),
      return_url: appUrl(`/dashboard/${businessId}/payments?stripe=return`),
    });
    return { ok: true, url: link.url };
  } catch (e) {
    return failure(e, "We couldn't start Stripe setup. Please try again.");
  }
}

/** Re-reads the connected account from Stripe (after onboarding returns). */
export async function refreshStripeStatus(
  businessId: string,
): Promise<Result<{ chargesEnabled: boolean; detailsSubmitted: boolean }>> {
  try {
    await requireBusinessRole(businessId);
    const service = createServiceClient();
    const { data: business } = await service
      .from("businesses")
      .select("stripe_account_id")
      .eq("id", businessId)
      .maybeSingle();
    if (!business?.stripe_account_id || !isStripeConfigured()) {
      return { ok: true, chargesEnabled: false, detailsSubmitted: false };
    }
    const account = await syncStripeAccount(business.stripe_account_id);
    revalidatePath(`/dashboard/${businessId}/payments`);
    return {
      ok: true,
      chargesEnabled: Boolean(account.charges_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
    };
  } catch (e) {
    return failure(e, "We couldn't reach Stripe. Please try again.");
  }
}

// ─────────────────────────────────────────────
// Business: payment settings
// ─────────────────────────────────────────────

const settingsSchema = z.object({
  cancellationWindowHours: z.number().int().min(0).max(720),
  services: z
    .array(
      z.object({
        id: z.string().uuid(),
        paymentMode: z.enum(["none", "deposit", "full"]),
        depositAmount: z.number().positive().max(100_000).nullable(),
      }),
    )
    .max(500),
});

export async function updatePaymentSettings(
  businessId: string,
  input: z.infer<typeof settingsSchema>,
): Promise<Result> {
  try {
    await requireBusinessRole(businessId, BUSINESS_ADMIN_ROLES);
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the settings." };
    }
    const { cancellationWindowHours, services } = parsed.data;
    const service = createServiceClient();

    const ids = services.map((s) => s.id);
    const { data: rows } = ids.length
      ? await service
          .from("business_services")
          .select("id, name, price, price_type")
          .eq("business_id", businessId)
          .in("id", ids)
      : { data: [] };
    const byId = new Map((rows ?? []).map((r) => [r.id, r]));
    if (byId.size !== new Set(ids).size) {
      return { ok: false, error: "Some services don't belong to this business." };
    }

    for (const s of services) {
      const row = byId.get(s.id)!;
      const priceCents = toCents(row.price);
      if (s.paymentMode === "full" && (row.price_type !== "fixed" || !priceCents)) {
        return { ok: false, error: `"${row.name}" needs a fixed price to take full payment online.` };
      }
      if (s.paymentMode === "deposit") {
        const depositCents = toCents(s.depositAmount);
        if (!depositCents) return { ok: false, error: `Enter a deposit amount for "${row.name}".` };
        if (depositCents < 50) {
          return { ok: false, error: `The deposit for "${row.name}" must be at least $0.50.` };
        }
        if (row.price_type === "fixed" && priceCents && depositCents > priceCents) {
          return { ok: false, error: `The deposit for "${row.name}" is more than its price.` };
        }
      }
    }

    const { error: bizError } = await service
      .from("businesses")
      .update({ cancellation_window_hours: cancellationWindowHours })
      .eq("id", businessId);
    if (bizError) throw new Error(bizError.message);

    for (const s of services) {
      const { error } = await service
        .from("business_services")
        .update({
          payment_mode: s.paymentMode,
          deposit_amount: s.paymentMode === "deposit" ? s.depositAmount : null,
        })
        .eq("id", s.id)
        .eq("business_id", businessId);
      if (error) throw new Error(error.message);
    }

    revalidatePath(`/dashboard/${businessId}/payments`);
    return { ok: true };
  } catch (e) {
    return failure(e, "We couldn't save your payment settings.");
  }
}

// ─────────────────────────────────────────────
// Customer: their own booking
// ─────────────────────────────────────────────

/**
 * Loads a booking the caller may act on as its customer: signed in as the
 * booking's customer, or holding the booking's private link token (guests).
 */
async function loadCustomerBooking(
  bookingId: string,
  token: string | null,
): Promise<BookingPaymentRow | null> {
  const parsedId = z.string().uuid().safeParse(bookingId);
  if (!parsedId.success) return null;
  const service = createServiceClient();
  const { data } = await service
    .from("bookings")
    .select(BOOKING_PAYMENT_COLUMNS)
    .eq("id", bookingId)
    .maybeSingle();
  const booking = data as BookingPaymentRow | null;
  if (!booking) return null;

  const user = await getUser();
  if (user && booking.customer_id === user.id) return booking;
  if (token && z.string().uuid().safeParse(token).success && token === booking.access_token) {
    return booking;
  }
  return null;
}

/** Sends the customer back to their unfinished Stripe Checkout. */
export async function resumeBookingPayment(
  bookingId: string,
  token: string | null,
): Promise<Result<{ url: string }>> {
  try {
    const booking = await loadCustomerBooking(bookingId, token);
    if (!booking) return { ok: false, error: "Booking not found." };
    const url = await getOpenCheckoutUrl(booking);
    if (!url) {
      await cancelUnpaidBooking(booking);
      return { ok: false, error: "The payment window closed, so the slot was released. Please book again." };
    }
    return { ok: true, url };
  } catch (e) {
    return failure(e, "We couldn't reopen the payment page.");
  }
}

/**
 * Customer cancels their booking. Unpaid holds are released. Paid bookings
 * are refunded in full when cancelled before the business's cancellation
 * window; inside the window the customer must contact the business.
 */
export async function cancelMyBooking(
  bookingId: string,
  token: string | null,
): Promise<Result<{ refundedCents: number }>> {
  try {
    const booking = await loadCustomerBooking(bookingId, token);
    if (!booking) return { ok: false, error: "Booking not found." };
    if (!["pending", "confirmed"].includes(booking.status)) {
      return { ok: false, error: "This booking can't be cancelled." };
    }

    if (booking.payment_status === "awaiting_payment") {
      await cancelUnpaidBooking(booking);
      revalidatePath(`/bookings/${booking.id}`);
      return { ok: true, refundedCents: 0 };
    }

    const service = createServiceClient();
    const { data: business } = await service
      .from("businesses")
      .select("timezone, cancellation_window_hours")
      .eq("id", booking.business_id)
      .maybeSingle();
    const deadline = cancellationDeadline(booking, business);
    if (Date.now() > deadline.getTime()) {
      return {
        ok: false,
        error: `Online cancellation closed ${business?.cancellation_window_hours ?? 24} hours before the appointment. Please message the business.`,
      };
    }

    let refundedCents = 0;
    if (booking.payment_status === "paid" || booking.payment_status === "partially_refunded") {
      const refund = await refundBookingPayment(booking);
      if ("error" in refund) return { ok: false, error: refund.error };
      refundedCents = refund.refundedCents;
    }

    await service
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id)
      .in("status", ["pending", "confirmed"]);

    revalidatePath(`/bookings/${booking.id}`);
    revalidatePath("/bookings");
    return { ok: true, refundedCents };
  } catch (e) {
    return failure(e, "We couldn't cancel the booking. Please try again.");
  }
}
