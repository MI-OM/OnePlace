"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getAvailableSlots, createBooking } from "@/lib/business/booking-actions";
import type { TimeSlot } from "@/lib/business/booking-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  businessId: string;
  services: {
    id: string;
    name: string;
    description?: string | null;
    durationMinutes: number;
    price: number | null;
    priceType: string;
  }[];
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingForm({ businessId, services }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<"service" | "date" | "time" | "details">("service");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Details form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Available slots
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const service = services.find((s) => s.id === selectedService);

  // Fetch available slots when date and service are selected
  useEffect(() => {
    if (!selectedService || !selectedDate) return;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);

    getAvailableSlots(businessId, selectedService, selectedDate)
      .then((result) => {
        setSlots(result.slots);
        if (result.error) setSlotsError(result.error);
      })
      .catch(() => {
        setSlotsError("Failed to load available times.");
      })
      .finally(() => setSlotsLoading(false));
  }, [selectedService, selectedDate, businessId]);

  const handleSubmit = () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    startTransition(async () => {
      const result = await createBooking({
        businessId,
        serviceId: selectedService,
        staffMemberId: selectedSlot.staff_member_id,
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        notes: notes.trim() || undefined,
        customerName: name.trim(),
        customerEmail: email.trim() || undefined,
        customerPhone: phone.trim() || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Booking request submitted! You'll receive confirmation shortly.");
        router.push(`/business/${businessId}`);
      }
    });
  };

  // Build calendar days
  const buildCalendar = () => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: { date: string; day: number; disabled: boolean; isToday: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: "", day: 0, disabled: true, isToday: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        day: d,
        disabled: dateObj < today,
        isToday: dateObj.getTime() === today.getTime(),
      });
    }
    return days;
  };

  const calDays = buildCalendar();
  const monthLabel = new Date(calMonth.year, calMonth.month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-8 space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={step === "service" ? "font-medium text-foreground" : ""}>1. Service</span>
        <span>→</span>
        <span className={step === "date" ? "font-medium text-foreground" : ""}>2. Date</span>
        <span>→</span>
        <span className={step === "time" ? "font-medium text-foreground" : ""}>3. Time</span>
        <span>→</span>
        <span className={step === "details" ? "font-medium text-foreground" : ""}>4. Details</span>
      </div>

      {/* Step: Service */}
      {step === "service" && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Select a service</h2>
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedService(s.id);
                setStep("date");
              }}
              className={`w-full rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/50 ${selectedService === s.id ? "bg-muted" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  {s.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {s.durationMinutes} min
                  {s.price != null && (
                    <p className="font-medium text-foreground">${s.price.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
          {services.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No bookable services available at this time.
            </p>
          )}
        </div>
      )}

      {/* Step: Date */}
      {step === "date" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Pick a date</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("service")}>
              Change service
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setCalMonth((prev) => {
                  const m = prev.month - 1;
                  return m < 0
                    ? { year: prev.year - 1, month: 11 }
                    : { year: prev.year, month: m };
                })
              }
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <span className="text-sm font-medium">{monthLabel}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setCalMonth((prev) => {
                  const m = prev.month + 1;
                  return m > 11
                    ? { year: prev.year + 1, month: 0 }
                    : { year: prev.year, month: m };
                })
              }
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-1 text-muted-foreground">{d}</div>
            ))}
            {calDays.map((d, i) =>
              d.date ? (
                <button
                  key={i}
                  disabled={d.disabled}
                  onClick={() => {
                    setSelectedDate(d.date);
                    setStep("time");
                  }}
                  className={`rounded-lg py-2 text-sm transition-colors ${
                    d.date === selectedDate
                      ? "bg-foreground text-background font-medium"
                      : d.isToday
                        ? "bg-muted font-medium"
                        : d.disabled
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-muted/50"
                  }`}
                >
                  {d.day}
                </button>
              ) : (
                <div key={i} />
              ),
            )}
          </div>
        </div>
      )}

      {/* Step: Time */}
      {step === "time" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              Available times for {selectedDate}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("date")}>
              Change date
            </Button>
          </div>

          {slotsLoading && (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" aria-hidden />
              <p className="mt-2 text-sm text-muted-foreground">Loading times…</p>
            </div>
          )}

          {slotsError && !slotsLoading && (
            <div className="rounded-xl border border-border p-4 text-center text-sm text-muted-foreground">
              {slotsError}
            </div>
          )}

          {!slotsLoading && !slotsError && slots.length === 0 && (
            <div className="rounded-xl border border-border p-4 text-center text-sm text-muted-foreground">
              No available times for this date. Try another day.
            </div>
          )}

          {!slotsLoading && slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot, i) => {
                const key = `${slot.start}-${slot.staff_member_id ?? "any"}-${i}`;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep("details");
                    }}
                    className={`rounded-xl border border-border px-3 py-2.5 text-center text-sm transition-colors hover:bg-muted/50 ${
                      selectedSlot?.start === slot.start &&
                      selectedSlot?.staff_member_id === slot.staff_member_id
                        ? "bg-foreground text-background"
                        : ""
                    }`}
                  >
                    {slot.start}
                    {slot.staff_name && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{slot.staff_name}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Your details</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("time")}>
              Change time
            </Button>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Service:</span>{" "}
              <span className="font-medium">{service?.name}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Date:</span>{" "}
              <span className="font-medium">{selectedDate}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Time:</span>{" "}
              <span className="font-medium">
                {selectedSlot?.start} – {selectedSlot?.end}
              </span>
            </p>
            {selectedSlot?.staff_name && (
              <p>
                <span className="text-muted-foreground">Staff:</span>{" "}
                <span className="font-medium">{selectedSlot.staff_name}</span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or details…"
                rows={3}
              />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={pending} className="w-full">
            {pending ? "Submitting…" : "Request booking"}
          </Button>
        </div>
      )}
    </div>
  );
}
