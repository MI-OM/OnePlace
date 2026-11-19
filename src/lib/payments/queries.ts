/**
 * Server-only data loaders for booking + payment pages. Not "use server":
 * these are called from server components, never from the browser.
 */
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { getUser } from "@/lib/auth";
import { getBusinessRole } from "@/lib/authz";
import { zonedDateTimeToUtc } from "@/lib/payments/stripe";
import {
  BOOKING_PAYMENT_COLUMNS,
  syncBookingCheckout,
  type BookingPaymentRow,
} from "@/lib/payments/core";

const DEFAULT_TZ = "America/St_Johns";

export function cancellationDeadline(
  booking: Pick<BookingPaymentRow, "booking_date" | "start_time">,
  business: { timezone?: string | null; cancellation_window_hours?: number | null } | null,
): Date {
  const start = zonedDateTimeToUtc(
    booking.booking_date,
    booking.start_time,
    business?.timezone || DEFAULT_TZ,
  );
  const hours = business?.cancellation_window_hours ?? 24;
  return new Date(start.getTime() - hours * 3_600_000);
}

export type BookingView = BookingPaymentRow & {
  businessName: string;
  businessSlug: string | null;
  businessTimezone: string;
  serviceName: string | null;
  cancellationWindowHours: number;
  cancelDeadline: string;
  canCancelOnline: boolean;
  viewerIsCustomer: boolean;
};

async function decorate(rows: BookingPaymentRow[]): Promise<BookingView[]> {
  if (rows.length === 0) return [];
  const service = createServiceClient();
  const businessIds = [...new Set(rows.map((r) => r.business_id))];
  const serviceIds = [...new Set(rows.map((r) => r.service_id).filter(Boolean))] as string[];
  const [{ data: businesses }, { data: services }] = await Promise.all([
    service
      .from("businesses")
      .select("id, name, slug, timezone, cancellation_window_hours")
      .in("id", businessIds),
    serviceIds.length
      ? service.from("business_services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const bizById = new Map((businesses ?? []).map((b) => [b.id, b]));
  const svcById = new Map((services ?? []).map((s) => [s.id, s]));

  return rows.map((r) => {
    const biz = bizById.get(r.business_id) ?? null;
    const deadline = cancellationDeadline(r, biz);
    const open = ["pending", "confirmed"].includes(r.status);
    return {
      ...r,
      businessName: biz?.name ?? "Business",
      businessSlug: biz?.slug ?? null,
      businessTimezone: biz?.timezone || DEFAULT_TZ,
      serviceName: r.service_id ? (svcById.get(r.service_id)?.name ?? null) : null,
      cancellationWindowHours: biz?.cancellation_window_hours ?? 24,
      cancelDeadline: deadline.toISOString(),
      canCancelOnline:
        open && (r.payment_status === "awaiting_payment" || Date.now() <= deadline.getTime()),
      viewerIsCustomer: true,
    };
  });
}

/**
 * A single booking for its customer (signed in, or via the private link
 * token for guests) or a member of its business. Returns null otherwise.
 * Also pulls the latest Checkout state from Stripe so a returning customer
 * sees "paid" even if the webhook hasn't landed yet.
 */
export async function getBookingForViewer(
  bookingId: string,
  token: string | null,
): Promise<BookingView | null> {
  if (!z.string().uuid().safeParse(bookingId).success) return null;
  const service = createServiceClient();
  const load = async () => {
    const { data } = await service
      .from("bookings")
      .select(BOOKING_PAYMENT_COLUMNS)
      .eq("id", bookingId)
      .maybeSingle();
    return data as BookingPaymentRow | null;
  };

  let booking = await load();
  if (!booking) return null;

  const user = await getUser();
  const isCustomer =
    (user && booking.customer_id === user.id) ||
    (token !== null && token === booking.access_token);
  const isStaff = !isCustomer && user ? Boolean(await getBusinessRole(user.id, booking.business_id)) : false;
  if (!isCustomer && !isStaff) return null;

  if (booking.payment_status === "awaiting_payment") {
    await syncBookingCheckout(booking);
    booking = (await load()) ?? booking;
  }

  const [view] = await decorate([booking]);
  return { ...view, viewerIsCustomer: Boolean(isCustomer) };
}

/** The signed-in customer's bookings, upcoming first. */
export async function getMyBookings(): Promise<BookingView[]> {
  const user = await getUser();
  if (!user) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("bookings")
    .select(BOOKING_PAYMENT_COLUMNS)
    .eq("customer_id", user.id)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(200);
  return decorate((data ?? []) as BookingPaymentRow[]);
}

export type PaymentsOverview = {
  stripeConfigured: boolean;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  cancellationWindowHours: number;
  services: {
    id: string;
    name: string;
    price: number | null;
    priceType: string;
    currency: string;
    paymentMode: "none" | "deposit" | "full";
    depositAmount: number | null;
  }[];
  recentPayments: {
    id: string;
    customerName: string | null;
    bookingDate: string;
    startTime: string;
    paymentStatus: string;
    paymentKind: string | null;
    amountPaidCents: number;
    amountRefundedCents: number;
    currency: string;
    paidAt: string | null;
  }[];
  totals: { paidCents: number; refundedCents: number; count: number };
};

/** Caller must already be authorized for this business. */
export async function getBusinessPaymentsOverview(
  businessId: string,
): Promise<PaymentsOverview | null> {
  const service = createServiceClient();
  const [{ data: business }, { data: services }, { data: payments }] = await Promise.all([
    service
      .from("businesses")
      .select("stripe_account_id, stripe_charges_enabled, stripe_details_submitted, cancellation_window_hours")
      .eq("id", businessId)
      .maybeSingle(),
    service
      .from("business_services")
      .select("id, name, price, price_type, currency, payment_mode, deposit_amount")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("name"),
    service
      .from("bookings")
      .select(
        "id, customer_name, booking_date, start_time, payment_status, payment_kind, amount_paid_cents, amount_refunded_cents, currency, paid_at",
      )
      .eq("business_id", businessId)
      .in("payment_status", ["paid", "partially_refunded", "refunded"])
      .order("paid_at", { ascending: false })
      .limit(100),
  ]);
  if (!business) return null;

  const recent = (payments ?? []).map((p) => ({
    id: p.id,
    customerName: p.customer_name,
    bookingDate: p.booking_date,
    startTime: p.start_time,
    paymentStatus: p.payment_status,
    paymentKind: p.payment_kind,
    amountPaidCents: p.amount_paid_cents ?? 0,
    amountRefundedCents: p.amount_refunded_cents ?? 0,
    currency: (p.currency ?? "CAD").trim(),
    paidAt: p.paid_at,
  }));

  return {
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeAccountId: business.stripe_account_id,
    chargesEnabled: Boolean(business.stripe_charges_enabled),
    detailsSubmitted: Boolean(business.stripe_details_submitted),
    cancellationWindowHours: business.cancellation_window_hours ?? 24,
    services: (services ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price === null ? null : Number(s.price),
      priceType: s.price_type,
      currency: (s.currency ?? "CAD").trim(),
      paymentMode: (s.payment_mode ?? "none") as "none" | "deposit" | "full",
      depositAmount: s.deposit_amount === null ? null : Number(s.deposit_amount),
    })),
    recentPayments: recent,
    totals: {
      paidCents: recent.reduce((sum, p) => sum + p.amountPaidCents, 0),
      refundedCents: recent.reduce((sum, p) => sum + p.amountRefundedCents, 0),
      count: recent.length,
    },
  };
}
