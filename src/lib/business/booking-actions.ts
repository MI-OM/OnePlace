"use server";

import { getUser } from "@/lib/auth";
import { getBusinessRole, requireBusinessRole } from "@/lib/authz";
import {
  CHECKOUT_HOLD_MINUTES,
  isStripeConfigured,
  onlinePaymentFor,
} from "@/lib/payments/stripe";
import {
  BOOKING_PAYMENT_COLUMNS,
  bookingPagePath,
  cancelUnpaidBooking,
  createCheckoutForBooking,
  refundBookingPayment,
  type BookingPaymentRow,
} from "@/lib/payments/core";
import { createServiceClient } from "@/lib/supabase/service";
import { one } from "@/lib/utils";
import { DAY_LABELS, formatTime } from "@/lib/format";

type ProfileName = {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
} | null;

/** profiles has no full_name column; build one from what is there. */
function profileName(p: ProfileName | ProfileName[] | undefined): string | null {
  const row = Array.isArray(p) ? p[0] : p;
  if (!row) return null;
  const full = [row.first_name, row.last_name].filter(Boolean).join(" ");
  return row.display_name || full || null;
}

export type BookingItem = {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  service_id: string | null;
  service_name: string | null;
  staff_member_id: string | null;
  staff_name: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  payment_status: string;
  payment_kind: string | null;
  amount_paid_cents: number;
  amount_refunded_cents: number;
  currency: string;
};

/** An unpaid hold whose checkout window has passed no longer blocks a slot. */
function isLiveBooking(b: { payment_status?: string | null; payment_hold_expires_at?: string | null }) {
  return !(
    b.payment_status === "awaiting_payment" &&
    b.payment_hold_expires_at &&
    new Date(b.payment_hold_expires_at).getTime() < Date.now()
  );
}

export type TimeSlot = {
  start: string;
  end: string;
  staff_member_id: string | null;
  staff_name: string | null;
};

/**
 * Available slots for a given business, service, date, and optional staff.
 * Combines business hours, staff availability, existing bookings, and
 * service duration to produce bookable time windows.
 */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  date: string,
  staffMemberId?: string | null,
): Promise<{ slots: TimeSlot[]; error?: string }> {
  const service = createServiceClient();

  // Get service duration
  const { data: svc } = await service
    .from("business_services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .maybeSingle();

  const duration = svc?.duration_minutes ?? 30;
  const slotCount = Math.max(1, Math.ceil(duration / 30));
  const slotMinutes = 30;

  // Parse date to get day of week
  const dateObj = new Date(date + "T12:00:00Z");
  const dow = dateObj.getUTCDay(); // 0=Sun

  // Get business hours for this day
  const { data: hours } = await service
    .from("business_hours")
    .select("is_closed, opens_at, closes_at")
    .eq("business_id", businessId)
    .eq("day_of_week", dow)
    .maybeSingle();

  if (!hours || hours.is_closed) {
    return { slots: [], error: "Business is closed on this date." };
  }

  // Get availability exceptions for this date
  const { data: exception } = await service
    .from("availability_exceptions")
    .select("is_closed, opens_at, closes_at")
    .eq("business_id", businessId)
    .eq("exception_date", date)
    .maybeSingle();

  const effectiveOpens = exception?.opens_at ?? hours.opens_at;
  const effectiveCloses = exception?.closes_at ?? hours.closes_at;

  if (exception?.is_closed) {
    return { slots: [], error: "Business is closed on this date (exception)." };
  }

  if (!effectiveOpens || !effectiveCloses) {
    return { slots: [], error: "Business hours not set for this day." };
  }

  // Get staff members who can serve this service
  const staffFilter = service.from("business_members")
    .select("id, user_id, role, user:profiles(display_name, first_name, last_name)")
    .eq("business_id", businessId)
    .eq("status", "active")
    .in("role", ["owner", "manager", "staff"]);

  let eligibleStaff: { id: string; name: string }[] = [];

  const { data: allMembers } = await staffFilter;

  if (staffMemberId) {
    // If specific staff requested, check their availability
    const member = allMembers?.find((m) => m.id === staffMemberId);
    if (!member) {
      return { slots: [], error: "Staff member not found." };
    }
    eligibleStaff = [{ id: staffMemberId, name: profileName(member.user) ?? "Staff" }];
  } else {
    // Check which staff have this service as a specialty
    const { data: specialties } = await service
      .from("staff_specialties")
      .select("staff_member_id")
      .eq("service_id", serviceId);

    if (specialties && specialties.length > 0) {
      const specialtyIds = new Set(specialties.map((s) => s.staff_member_id));
      eligibleStaff = (allMembers ?? [])
        .filter((m) => specialtyIds.has(m.id))
        .map((m) => ({ id: m.id, name: profileName(m.user) ?? "Staff" }));
    } else {
      // No specialties set: all active members are eligible
      eligibleStaff = (allMembers ?? []).map((m) => ({
        id: m.id,
        name: profileName(m.user) ?? "Staff",
      }));
    }
  }

  if (eligibleStaff.length === 0) {
    return { slots: [], error: "No staff available for this service." };
  }

  // Get existing bookings for this date
  const { data: existingBookings } = await service
    .from("bookings")
    .select("staff_member_id, start_time, end_time, status, payment_status, payment_hold_expires_at")
    .eq("business_id", businessId)
    .eq("booking_date", date)
    .in("status", ["pending", "confirmed"]);

  // Get staff availability for the day
  const staffIds = eligibleStaff.map((s) => s.id);
  const { data: availability } = await service
    .from("staff_availability")
    .select("staff_member_id, start_time, end_time, is_available")
    .in("staff_member_id", staffIds)
    .eq("day_of_week", dow);

  // Generate time slots
  const openMinutes = timeToMinutes(effectiveOpens);
  const closeMinutes = timeToMinutes(effectiveCloses);
  const slots: TimeSlot[] = [];

  for (const staff of eligibleStaff) {
    // Check staff availability
    const avail = availability?.find((a) => a.staff_member_id === staff.id);
    const staffOpens = avail?.is_available !== false
      ? avail?.start_time ?? effectiveOpens
      : null;

    if (!staffOpens) continue;

    const staffOpenMin = timeToMinutes(staffOpens);
    const staffClosesMin = avail?.end_time
      ? timeToMinutes(avail.end_time)
      : closeMinutes;

    const slotStart = Math.max(openMinutes, staffOpenMin);

    for (let m = slotStart; m + slotMinutes <= Math.min(closeMinutes, staffClosesMin + 1); m += slotMinutes) {
      const slotEnd = m + (slotCount * slotMinutes);

      if (slotEnd > Math.min(closeMinutes, staffClosesMin + 1)) break;

      const slotStartStr = minutesToTime(m);
      const slotEndStr = minutesToTime(slotEnd);

      // Check if slot overlaps any existing booking for this staff member
      const overlaps = (existingBookings ?? []).some((b) => {
        if (b.staff_member_id !== staff.id || !isLiveBooking(b)) return false;
        const bStart = timeToMinutes(b.start_time);
        const bEnd = timeToMinutes(b.end_time);
        return m < bEnd && slotEnd > bStart;
      });

      if (!overlaps) {
        slots.push({
          start: slotStartStr,
          end: slotEndStr,
          staff_member_id: staff.id,
          staff_name: staff.name,
        });
      }
    }
  }

  return { slots };
}

/** Create a new booking */
export async function createBooking(params: {
  businessId: string;
  serviceId: string;
  staffMemberId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}): Promise<{ id?: string; error?: string; checkoutUrl?: string; bookingUrl?: string }> {
  const user = await getUser();
  const service = createServiceClient();

  const timeRe = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(params.date) ||
    !timeRe.test(params.startTime) ||
    !timeRe.test(params.endTime) ||
    params.endTime <= params.startTime
  ) {
    return { error: "Please pick a valid time slot." };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (params.date < today) {
    return { error: "That date has already passed." };
  }
  if (!user && !params.customerEmail && !params.customerPhone) {
    return { error: "Please add an email or phone so the business can reach you." };
  }

  const { data: biz } = await service
    .from("businesses")
    .select("id, stripe_account_id, stripe_charges_enabled")
    .eq("id", params.businessId)
    .eq("status", "active")
    .maybeSingle();
  const { data: svc } = await service
    .from("business_services")
    .select("id, price, price_type, currency, payment_mode, deposit_amount")
    .eq("id", params.serviceId)
    .eq("business_id", params.businessId)
    .eq("is_active", true)
    .maybeSingle();
  if (!biz || !svc) {
    return { error: "This service isn't available for booking." };
  }

  if (params.staffMemberId) {
    const { data: staff } = await service
      .from("business_members")
      .select("id")
      .eq("id", params.staffMemberId)
      .eq("business_id", params.businessId)
      .eq("status", "active")
      .maybeSingle();
    if (!staff) return { error: "That team member isn't available." };

    // Reject overlaps with the staff member's open bookings. (A DB exclusion
    // constraint in the RLS hardening migration closes the race window.)
    const { data: clash } = await service
      .from("bookings")
      .select("id, payment_status, payment_hold_expires_at")
      .eq("staff_member_id", params.staffMemberId)
      .eq("booking_date", params.date)
      .in("status", ["pending", "confirmed"])
      .lt("start_time", params.endTime)
      .gt("end_time", params.startTime)
      .limit(5);
    if ((clash ?? []).some(isLiveBooking)) {
      return { error: "That slot was just taken. Please pick another time." };
    }
  }

  // Online payment applies when the service asks for it and the business has
  // finished connecting Stripe. Otherwise the booking works as before.
  const online =
    isStripeConfigured() && biz.stripe_charges_enabled && biz.stripe_account_id
      ? onlinePaymentFor(svc)
      : null;

  const { data, error } = await service
    .from("bookings")
    .insert({
      ...(online
        ? {
            payment_status: "awaiting_payment",
            payment_kind: online.kind,
            amount_due_cents: online.cents,
            currency: (svc.currency ?? "CAD").trim().toUpperCase(),
            stripe_account_id: biz.stripe_account_id,
            payment_hold_expires_at: new Date(
              Date.now() + CHECKOUT_HOLD_MINUTES * 60_000,
            ).toISOString(),
          }
        : {}),
      business_id: params.businessId,
      customer_id: user?.id ?? null,
      service_id: params.serviceId,
      staff_member_id: params.staffMemberId ?? null,
      booking_date: params.date,
      start_time: params.startTime,
      end_time: params.endTime,
      notes: params.notes ?? null,
      customer_name: params.customerName ?? null,
      customer_email: params.customerEmail || user?.email || null,
      customer_phone: params.customerPhone ?? null,
      status: "pending",
    })
    .select("id, access_token")
    .single();

  if (error) {
    // 23P01 = slot taken (double-booking guard in the database).
    if (error.code === "23P01") {
      return { error: "That slot was just taken. Please pick another time." };
    }
    return { error: "Failed to create booking." };
  }

  const bookingUrl = bookingPagePath(data);
  if (!online) return { id: data.id, bookingUrl };

  const checkout = await createCheckoutForBooking(data.id);
  if ("error" in checkout) {
    // Don't leave the slot held by a booking nobody can pay for.
    await service
      .from("bookings")
      .update({ status: "cancelled", payment_status: "failed", payment_hold_expires_at: null })
      .eq("id", data.id);
    return { error: checkout.error };
  }
  return { id: data.id, bookingUrl, checkoutUrl: checkout.url };
}

async function loadPaymentRow(bookingId: string, businessId: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("bookings")
    .select(BOOKING_PAYMENT_COLUMNS)
    .eq("id", bookingId)
    .eq("business_id", businessId)
    .maybeSingle();
  return data as BookingPaymentRow | null;
}

/**
 * Staff-side cancellation: releases unpaid holds and refunds paid bookings
 * in full (the business is the one cancelling).
 */
async function cancelAsBusiness(
  businessId: string,
  bookingId: string,
): Promise<{ error?: string; refundedCents?: number }> {
  const booking = await loadPaymentRow(bookingId, businessId);
  if (!booking) return { error: "Booking not found." };

  if (booking.payment_status === "awaiting_payment") {
    await cancelUnpaidBooking(booking);
    return {};
  }
  let refundedCents = 0;
  if (booking.payment_status === "paid" || booking.payment_status === "partially_refunded") {
    const refund = await refundBookingPayment(booking);
    if ("error" in refund) return { error: refund.error };
    refundedCents = refund.refundedCents;
  }
  const service = createServiceClient();
  const { error } = await service
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("business_id", businessId);
  if (error) return { error: "Failed to cancel booking." };
  return { refundedCents };
}

/** Cancel a booking */
export async function cancelBooking(
  businessId: string,
  bookingId: string,
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated." };
  // Customers cancel through cancelMyBooking (cancellation window + refund).
  if (!(await getBusinessRole(user.id, businessId))) {
    return { error: "You don't have access to this business." };
  }
  const { error } = await cancelAsBusiness(businessId, bookingId);

  if (error) return { error };
  return {};
}

/** Update booking status (staff/owner only) */
export async function updateBookingStatus(
  businessId: string,
  bookingId: string,
  status: "confirmed" | "cancelled" | "completed" | "no_show",
): Promise<{ error?: string; refundedCents?: number }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated." };
  if (!(await getBusinessRole(user.id, businessId))) {
    return { error: "You don't have access to this business." };
  }
  if (!["confirmed", "cancelled", "completed", "no_show"].includes(status)) {
    return { error: "Invalid status." };
  }

  if (status === "cancelled") {
    const result = await cancelAsBusiness(businessId, bookingId);
    return result.error ? { error: result.error } : { refundedCents: result.refundedCents };
  }

  const current = await loadPaymentRow(bookingId, businessId);
  if (!current) return { error: "Booking not found." };
  if (current.payment_status === "awaiting_payment") {
    return { error: "This booking is still waiting for the customer's payment." };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("business_id", businessId);

  if (error) return { error: "Failed to update booking." };
  return {};
}

/** List bookings for a business (owner/staff view) */
export async function getBusinessBookings(
  businessId: string,
  date?: string,
): Promise<BookingItem[]> {
  await requireBusinessRole(businessId);
  const service = createServiceClient();

  let query = service
    .from("bookings")
    .select(`
      id, customer_id, customer_name, customer_email, customer_phone,
      service_id, staff_member_id, booking_date, start_time, end_time,
      status, notes, created_at,
      payment_status, payment_kind, amount_paid_cents, amount_refunded_cents, currency,
      business_services(name),
      staff:business_members!bookings_staff_member_id_fkey(
        user:profiles(display_name, first_name, last_name)
      )
    `)
    .eq("business_id", businessId)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (date) {
    query = query.eq("booking_date", date);
  }

  const { data } = await query;

  return (data ?? []).map((row) => ({
    id: row.id,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    service_id: row.service_id,
    service_name: one(row.business_services)?.name ?? null,
    staff_member_id: row.staff_member_id,
    staff_name: profileName(one(row.staff)?.user) ?? null,
    booking_date: row.booking_date,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    payment_status: row.payment_status ?? "not_required",
    payment_kind: row.payment_kind ?? null,
    amount_paid_cents: row.amount_paid_cents ?? 0,
    amount_refunded_cents: row.amount_refunded_cents ?? 0,
    currency: (row.currency ?? "CAD").trim(),
  }));
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
