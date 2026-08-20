"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { toCSV } from "@/lib/csv";

type ReportData = {
  headers: string[];
  rows: (string | number | null | undefined)[][];
};

export async function getAdminBusinessesData(): Promise<ReportData> {
  const service = createServiceClient();
  const { data } = await service
    .from("businesses")
    .select(
      `id, name, slug, status, verification_status, city, province,
       is_featured, is_sponsored, created_at`,
    )
    .order("created_at", { ascending: false });

  const headers = [
    "Name",
    "Slug",
    "Status",
    "Verification",
    "City",
    "Province",
    "Featured",
    "Sponsored",
    "Created",
  ];

  const rows = (data ?? []).map((b: any) => [
    b.name,
    b.slug,
    b.status,
    b.verification_status,
    b.city ?? "",
    b.province ?? "",
    b.is_featured ? "Yes" : "No",
    b.is_sponsored ? "Yes" : "No",
    new Date(b.created_at).toLocaleDateString(),
  ]);

  return { headers, rows };
}

export async function getAdminUsersData(): Promise<ReportData> {
  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select(`id, display_name, first_name, last_name, phone, is_active, created_at`)
    .order("created_at", { ascending: false });

  const headers = ["Name", "Phone", "Status", "Joined"];

  const rows = (data ?? []).map((u: any) => [
    u.display_name ??
      [u.first_name, u.last_name].filter(Boolean).join(" ") ??
      "—",
    u.phone ?? "",
    u.is_active ? "Active" : "Inactive",
    new Date(u.created_at).toLocaleDateString(),
  ]);

  return { headers, rows };
}

export async function getAdminReviewsData(): Promise<ReportData> {
  const service = createServiceClient();
  const { data } = await service
    .from("reviews")
    .select(
      `id, rating, title, body, status, created_at,
       business:businesses(name),
       reviewer:profiles!reviewer_id(display_name, first_name, last_name)`,
    )
    .order("created_at", { ascending: false });

  const headers = [
    "Date",
    "Rating",
    "Status",
    "Business",
    "Reviewer",
    "Title",
    "Body",
  ];

  const rows = (data ?? []).map((r: any) => [
    new Date(r.created_at).toLocaleDateString(),
    r.rating,
    r.status,
    r.business?.name ?? "",
    r.reviewer
      ? r.reviewer.display_name ??
        [r.reviewer.first_name, r.reviewer.last_name].filter(Boolean).join(" ")
      : "Anonymous",
    r.title ?? "",
    r.body ?? "",
  ]);

  return { headers, rows };
}

export async function getAdminAuditData(
  filters?: { entityType?: string; action?: string; days?: number },
): Promise<ReportData> {
  const service = createServiceClient();
  let query = service
    .from("audit_logs")
    .select(
      `id, action, entity_type, entity_id, old_values, new_values,
       actor_user_id, business_id, ip_address, created_at`,
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters?.action) {
    query = query.ilike("action", `%${filters.action}%`);
  }
  if (filters?.days) {
    const since = new Date();
    since.setDate(since.getDate() - filters.days);
    query = query.gte("created_at", since.toISOString());
  }

  const { data } = await query;

  const headers = [
    "Timestamp",
    "Action",
    "Entity Type",
    "Entity ID",
    "Actor",
    "Business ID",
    "IP Address",
    "Old Values",
    "New Values",
  ];

  const rows = (data ?? []).map((log: any) => [
    new Date(log.created_at).toLocaleString(),
    log.action,
    log.entity_type ?? "",
    log.entity_id ?? "",
    log.actor_user_id ?? "system",
    log.business_id ?? "",
    log.ip_address ?? "",
    log.old_values ? JSON.stringify(log.old_values).slice(0, 200) : "",
    log.new_values ? JSON.stringify(log.new_values).slice(0, 200) : "",
  ]);

  return { headers, rows };
}

export async function exportAdminBusinessesCSV(): Promise<string> {
  const { headers, rows } = await getAdminBusinessesData();
  return toCSV(headers, rows);
}

export async function exportAdminUsersCSV(): Promise<string> {
  const { headers, rows } = await getAdminUsersData();
  return toCSV(headers, rows);
}

export async function exportAdminReviewsCSV(): Promise<string> {
  const { headers, rows } = await getAdminReviewsData();
  return toCSV(headers, rows);
}

export async function exportAdminAuditCSV(
  filters?: { entityType?: string; action?: string; days?: number },
): Promise<string> {
  const { headers, rows } = await getAdminAuditData(filters);
  return toCSV(headers, rows);
}
