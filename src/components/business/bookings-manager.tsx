"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Calendar, Clock, User, CheckCircle, XCircle, Eye } from "lucide-react";
import { updateBookingStatus } from "@/lib/business/booking-actions";
import type { BookingItem } from "@/lib/business/booking-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  businessId: string;
  initialBookings: BookingItem[];
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-100 text-gray-800",
};

export function BookingsManager({ businessId, initialBookings }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [pending, startTransition] = useTransition();
  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [showAll, setShowAll] = useState(false);

  const filtered = showAll
    ? bookings
    : bookings.filter((b) => b.booking_date === dateFilter);

  const handleStatusChange = (
    bookingId: string,
    status: "confirmed" | "cancelled" | "completed" | "no_show",
  ) => {
    startTransition(async () => {
      const result = await updateBookingStatus(businessId, bookingId, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Booking ${status}.`);
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b)),
        );
      }
    });
  };

  return (
    <div className="mt-8">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-44"
          />
        </div>
        <Button variant={showAll ? "default" : "outline"} size="sm" onClick={() => setShowAll(false)}>
          {dateFilter}
        </Button>
        <Button variant={showAll ? "default" : "outline"} size="sm" onClick={() => setShowAll(true)}>
          All dates
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Bookings list */}
      <div className="mt-4 space-y-3">
        {filtered.map((booking) => (
          <div
            key={booking.id}
            className="rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[booking.status] ?? ""}`}>
                    {booking.status}
                  </span>
                  {booking.service_name && (
                    <span className="text-sm font-medium">{booking.service_name}</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" aria-hidden />
                    {booking.booking_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden />
                    {booking.start_time} – {booking.end_time}
                  </span>
                  {booking.staff_name && (
                    <span className="flex items-center gap-1">
                      <User className="size-3.5" aria-hidden />
                      {booking.staff_name}
                    </span>
                  )}
                  {booking.customer_name && (
                    <span className="flex items-center gap-1">
                      <User className="size-3.5" aria-hidden />
                      {booking.customer_name}
                    </span>
                  )}
                </div>
                {booking.notes && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Notes: {booking.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              {booking.status === "pending" && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusChange(booking.id, "confirmed")}
                    disabled={pending}
                  >
                    <CheckCircle className="mr-1 size-3.5" aria-hidden />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusChange(booking.id, "cancelled")}
                    disabled={pending}
                  >
                    <XCircle className="mr-1 size-3.5 text-red-500" aria-hidden />
                    Decline
                  </Button>
                </div>
              )}
              {booking.status === "confirmed" && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusChange(booking.id, "completed")}
                    disabled={pending}
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusChange(booking.id, "no_show")}
                    disabled={pending}
                  >
                    No show
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No bookings for this date.
          </div>
        )}
      </div>
    </div>
  );
}
