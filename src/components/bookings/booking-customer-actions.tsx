"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, XCircle } from "lucide-react";
import { cancelMyBooking, resumeBookingPayment } from "@/lib/payments/actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/components/bookings/booking-badges";

type Props = {
  bookingId: string;
  token: string | null;
  awaitingPayment: boolean;
  canCancel: boolean;
  /** Amount that would be refunded if cancelled now (cents). */
  refundableCents: number;
  currency: string;
};

export function BookingCustomerActions({
  bookingId,
  token,
  awaitingPayment,
  canCancel,
  refundableCents,
  currency,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const pay = () =>
    startTransition(async () => {
      const result = await resumeBookingPayment(bookingId, token);
      if (result.ok) {
        window.location.assign(result.url);
      } else {
        toast.error(result.error);
        router.refresh();
      }
    });

  const cancel = () =>
    startTransition(async () => {
      const result = await cancelMyBooking(bookingId, token);
      setConfirming(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.refundedCents > 0
          ? `Booking cancelled. ${formatMoney(result.refundedCents, currency)} is being refunded to your card.`
          : "Booking cancelled.",
      );
      router.refresh();
    });

  if (!awaitingPayment && !canCancel) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {awaitingPayment && (
        <Button onClick={pay} disabled={pending} className="sm:flex-1">
          <CreditCard className="mr-1.5 size-4" aria-hidden />
          Complete payment
        </Button>
      )}
      {canCancel &&
        (confirming ? (
          <div className="flex flex-1 flex-col gap-2 rounded-xl border border-border p-3 text-sm">
            <p>
              Cancel this booking?
              {refundableCents > 0
                ? ` You'll get ${formatMoney(refundableCents, currency)} back to your card.`
                : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={cancel} disabled={pending}>
                Yes, cancel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
                Keep booking
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setConfirming(true)}
            disabled={pending}
            className="sm:flex-1"
          >
            <XCircle className="mr-1.5 size-4" aria-hidden />
            Cancel booking
          </Button>
        ))}
    </div>
  );
}
