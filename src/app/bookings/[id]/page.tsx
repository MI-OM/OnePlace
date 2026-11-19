import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Info } from "lucide-react";

import { getUser } from "@/lib/auth";
import { getBookingForViewer } from "@/lib/payments/queries";
import { Button } from "@/components/ui/button";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
  formatBookingWhen,
  formatMoney,
} from "@/components/bookings/booking-badges";
import { BookingCustomerActions } from "@/components/bookings/booking-customer-actions";

export const metadata: Metadata = {
  title: "Your booking — OnePlace",
  // Guest links carry a private token: keep them out of search engines.
  robots: { index: false, follow: false },
};

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; checkout?: string }>;
}) {
  const { id } = await params;
  const { t, checkout } = await searchParams;
  const token = typeof t === "string" && t ? t : null;

  const [booking, user] = await Promise.all([getBookingForViewer(id, token), getUser()]);
  if (!booking) notFound();

  const refundable = booking.amount_paid_cents - booking.amount_refunded_cents;
  const awaiting = booking.payment_status === "awaiting_payment";
  const deadline = new Date(booking.cancelDeadline);
  const open = ["pending", "confirmed"].includes(booking.status);
  const deadlineLabel = deadline.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: booking.businessTimezone,
  });

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
      {user ? (
        <Button render={<Link href="/bookings" />} variant="ghost" size="sm" className="mb-6 -ml-2">
          <ArrowLeft className="mr-1 size-4" aria-hidden />
          My bookings
        </Button>
      ) : null}

      {checkout === "success" && booking.payment_status === "paid" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>Payment received. Your booking is confirmed. A receipt is on its way from Stripe.</p>
        </div>
      )}
      {checkout === "success" && awaiting && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <Clock className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>We&apos;re confirming your payment with Stripe. Refresh in a moment.</p>
        </div>
      )}
      {checkout === "cancelled" && awaiting && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            Payment not finished. We&apos;re holding your time until{" "}
            {booking.payment_hold_expires_at
              ? new Date(booking.payment_hold_expires_at).toLocaleTimeString("en-CA", {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: booking.businessTimezone,
                  timeZoneName: "short",
                })
              : "shortly"}
            .
          </p>
        </div>
      )}

      <p className="text-sm text-muted-foreground">Booking with</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {booking.businessSlug ? (
          <Link href={`/businesses/${booking.businessSlug}`} className="hover:underline">
            {booking.businessName}
          </Link>
        ) : (
          booking.businessName
        )}
      </h1>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <BookingStatusBadge status={booking.status} />
        <PaymentStatusBadge status={booking.payment_status} />
      </div>

      <dl className="mt-6 divide-y divide-border rounded-xl border border-border text-sm">
        <div className="flex justify-between gap-4 p-3">
          <dt className="text-muted-foreground">Service</dt>
          <dd className="text-right font-medium">{booking.serviceName ?? "Appointment"}</dd>
        </div>
        <div className="flex justify-between gap-4 p-3">
          <dt className="text-muted-foreground">When</dt>
          <dd className="text-right font-medium">
            {formatBookingWhen(booking.booking_date, booking.start_time, booking.end_time)}
          </dd>
        </div>
        {booking.amount_due_cents ? (
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-muted-foreground">
              {booking.payment_kind === "deposit" ? "Deposit" : "Price"}
            </dt>
            <dd className="text-right font-medium">
              {formatMoney(booking.amount_due_cents, booking.currency)}
              {booking.payment_kind === "deposit" && (
                <span className="block text-xs font-normal text-muted-foreground">
                  Balance paid to the business
                </span>
              )}
            </dd>
          </div>
        ) : null}
        {booking.amount_paid_cents > 0 && (
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-muted-foreground">Paid</dt>
            <dd className="text-right font-medium">
              {formatMoney(booking.amount_paid_cents, booking.currency)}
            </dd>
          </div>
        )}
        {booking.amount_refunded_cents > 0 && (
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-muted-foreground">Refunded</dt>
            <dd className="text-right font-medium">
              {formatMoney(booking.amount_refunded_cents, booking.currency)}
            </dd>
          </div>
        )}
      </dl>

      {open && booking.viewerIsCustomer && (
        <p className="mt-4 text-xs text-muted-foreground">
          {booking.payment_status === "paid" || booking.payment_status === "partially_refunded"
            ? `Free cancellation with a full refund until ${deadlineLabel}. `
            : `You can cancel online until ${deadlineLabel}. `}
          After that, message the business.
        </p>
      )}

      {booking.viewerIsCustomer && (
        <div className="mt-6">
          <BookingCustomerActions
            bookingId={booking.id}
            token={token}
            awaitingPayment={awaiting}
            canCancel={booking.canCancelOnline}
            refundableCents={refundable > 0 ? refundable : 0}
            currency={booking.currency}
          />
        </div>
      )}

      {!user && booking.viewerIsCustomer && (
        <p className="mt-8 text-xs text-muted-foreground">
          Keep this page&apos;s link to manage your booking, or{" "}
          <Link href="/signup" className="underline">
            create an account
          </Link>{" "}
          to see all your bookings in one place.
        </p>
      )}
    </main>
  );
}
