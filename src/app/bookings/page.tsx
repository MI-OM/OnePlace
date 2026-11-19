import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight } from "lucide-react";

import { getUser } from "@/lib/auth";
import { getMyBookings, type BookingView } from "@/lib/payments/queries";
import { Button } from "@/components/ui/button";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
  formatBookingWhen,
  formatMoney,
} from "@/components/bookings/booking-badges";

export const metadata: Metadata = {
  title: "My bookings — OnePlace",
  description: "Your appointments with local businesses.",
};

function isUpcoming(b: BookingView) {
  return ["pending", "confirmed"].includes(b.status) && b.booking_date >= new Date().toISOString().slice(0, 10);
}

function BookingRow({ b }: { b: BookingView }) {
  return (
    <li>
      <Link
        href={`/bookings/${b.id}`}
        className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{b.businessName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {b.serviceName ?? "Appointment"} · {formatBookingWhen(b.booking_date, b.start_time)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <BookingStatusBadge status={b.status} />
            <PaymentStatusBadge status={b.payment_status} />
            {b.amount_paid_cents > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatMoney(b.amount_paid_cents, b.currency)}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

export default async function MyBookingsPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/bookings");

  const bookings = await getMyBookings();
  const upcoming = bookings.filter(isUpcoming).reverse(); // soonest first
  const past = bookings.filter((b) => !isUpcoming(b));

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your appointments, payments and refunds in one place.
      </p>

      {bookings.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <CalendarDays className="size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm font-medium">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Find a local business and book a time that works for you.
          </p>
          <Button render={<Link href="/" />} className="mt-5">
            Find a service
          </Button>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-sm font-medium text-muted-foreground">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing coming up.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </ul>
            )}
          </section>
          {past.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-medium text-muted-foreground">Past and cancelled</h2>
              <ul className="mt-3 space-y-2">
                {past.map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
