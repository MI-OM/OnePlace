"use server";

import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { DAY_LABELS, formatTime } from "@/lib/format";

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
};

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
  let staffFilter = service.from("business_members")
    .select("id, user_id, role, profiles!inner(full_name)")
    .eq("business_id", businessId)
    .in("role", ["owner", "manager", "staff"]);

  let eligibleStaff: { id: string; name: string }[] = [];

  const { data: allMembers } = await staffFilter;

  if (staffMemberId) {
    // If specific staff requested, check their availability
    const member = allMembers?.find((m) => m.id === staffMemberId);
    if (!member) {
      return { slots: [], error: "Staff member not found." };
    }
    eligibleStaff = [{ id: staffMemberId, name: (member.profiles as any)?.full_name ?? "Staff" }];
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
        .map((m) => ({ id: m.id, name: (m.profiles as any)?.full_name ?? "Staff" }));
    } else {
      // No specialties set: all active members are eligible
      eligibleStaff = (allMembers ?? []).map((m) => ({
        id: m.id,
        name: (m.profiles as any)?.full_name ?? "Staff",
      }));
    }
  }

  if (eligibleStaff.length === 0) {
    return { slots: [], error: "No staff available for this service." };
  }

  // Get existing bookings for this date
  const { data: existingBookings } = await service
    .from("bookings")
    .select("staff_member_id, start_time, end_time, status")
    .eq("business_id", businessId)
    .eq("booking_date", date)
    .not("status", "in", "(cancelled)");

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
        if (b.staff_member_id !== staff.id) return false;
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
}): Promise<{ id?: string; error?: string }> {
  const user = await getUser();
  const service = createServiceClient();

  const { data, error } = await service
    .from("bookings")
    .insert({
      business_id: params.businessId,
      customer_id: user?.id ?? null,
      service_id: params.serviceId,
      staff_member_id: params.staffMemberId ?? null,
      booking_date: params.date,
      start_time: params.startTime,
      end_time: params.endTime,
      notes: params.notes ?? null,
      customer_name: params.customerName ?? null,
      customer_email: params.customerEmail ?? null,
      customer_phone: params.customerPhone ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to create booking." };
  }

  return { id: data.id };
}

/** Cancel a booking */
export async function cancelBooking(
  businessId: string,
  bookingId: string,
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated." };

  const service = createServiceClient();
  const { error } = await service
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("business_id", businessId);

  if (error) return { error: "Failed to cancel booking." };
  return {};
}

/** Update booking status (staff/owner only) */
export async function updateBookingStatus(
  businessId: string,
  bookingId: string,
  status: "confirmed" | "cancelled" | "completed" | "no_show",
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated." };

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
  const service = createServiceClient();

  let query = service
    .from("bookings")
    .select(`
      id, customer_id, customer_name, customer_email, customer_phone,
      service_id, staff_member_id, booking_date, start_time, end_time,
      status, notes, created_at,
      business_services!inner(name),
      profiles!bookings_staff_member_id_fkey(full_name)
    `)
    .eq("business_id", businessId)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (date) {
    query = query.eq("booking_date", date);
  }

  const { data } = await query;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    service_id: row.service_id,
    service_name: row.business_services?.name ?? null,
    staff_member_id: row.staff_member_id,
    staff_name: row.profiles?.full_name ?? null,
    booking_date: row.booking_date,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
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
