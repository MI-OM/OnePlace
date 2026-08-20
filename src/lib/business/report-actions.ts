"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { toCSV } from "@/lib/csv";

type ReportData = {
  headers: string[];
  rows: (string | number | null | undefined)[][];
};

export async function getBusinessBookingsData(
  businessId: string,
): Promise<ReportData> {
  const service = createServiceClient();
  const { data } = await service
    .from("bookings")
    .select(
      `id, booking_date, start_time, end_time, status, notes,
       customer_name, customer_email, customer_phone,
       service:business_services(name)`,
    )
    .eq("business_id", businessId)
    .order("booking_date", { ascending: false });

  const headers = [
    "Date",
    "Start Time",
    "End Time",
    "Status",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Service",
    "Notes",
    "Created",
  ];

  const rows = (data ?? []).map((b: any) => [
    b.booking_date,
    b.start_time,
    b.end_time,
    b.status,
    b.customer_name ?? "",
    b.customer_email ?? "",
    b.customer_phone ?? "",
    b.service?.name ?? "",
    b.notes ?? "",
    new Date(b.created_at).toLocaleDateString(),
  ]);

  return { headers, rows };
}

export async function getBusinessRequestsData(
  businessId: string,
): Promise<ReportData> {
  const service = createServiceClient();
  const { data } = await service
    .from("service_requests")
    .select(
      `id, request_type, status, notes, requested_date, requested_time,
       created_at, customer:profiles!customer_id(display_name, first_name, last_name),
       service:business_services(name)`,
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  const headers = [
    "Created",
    "Type",
    "Status",
    "Customer",
    "Service",
    "Preferred Date",
    "Preferred Time",
    "Notes",
  ];

  const rows = (data ?? []).map((r: any) => [
    new Date(r.created_at).toLocaleDateString(),
    r.request_type,
    r.status,
    r.customer
      ? r.customer.display_name ??
        [r.customer.first_name, r.customer.last_name].filter(Boolean).join(" ")
      : "Anonymous",
    r.service?.name ?? "General",
    r.requested_date ?? "",
    r.requested_time ?? "",
    r.notes ?? "",
  ]);

  return { headers, rows };
}

export async function getBusinessReviewsData(
  businessId: string,
): Promise<ReportData> {
  const service = createServiceClient();
  const { data } = await service
    .from("reviews")
    .select(
      `id, rating, title, body, status, created_at,
       reviewer:profiles!reviewer_id(display_name, first_name, last_name)`,
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  const headers = ["Date", "Rating", "Status", "Title", "Body", "Reviewer"];

  const rows = (data ?? []).map((r: any) => [
    new Date(r.created_at).toLocaleDateString(),
    r.rating,
    r.status,
    r.title ?? "",
    r.body ?? "",
    r.reviewer
      ? r.reviewer.display_name ??
        [r.reviewer.first_name, r.reviewer.last_name].filter(Boolean).join(" ")
      : "Anonymous",
  ]);

  return { headers, rows };
}

export async function exportBusinessBookingsCSV(
  businessId: string,
): Promise<string> {
  const { headers, rows } = await getBusinessBookingsData(businessId);
  return toCSV(headers, rows);
}

export async function exportBusinessRequestsCSV(
  businessId: string,
): Promise<string> {
  const { headers, rows } = await getBusinessRequestsData(businessId);
  return toCSV(headers, rows);
}

export async function exportBusinessReviewsCSV(
  businessId: string,
): Promise<string> {
  const { headers, rows } = await getBusinessReviewsData(businessId);
  return toCSV(headers, rows);
}
