"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { isMemberOf } from "@/lib/chat/staff";

export type ServiceRequestItem = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  requestType: string;
  serviceName: string | null;
  status: string;
  notes: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  conversationId: string | null;
  createdAt: string;
};

export async function getBusinessRequests(
  businessId: string,
): Promise<ServiceRequestItem[]> {
  const service = createServiceClient();

  const { data } = await service
    .from("service_requests")
    .select(`
      id, customer_id, request_type, status, notes,
      requested_date, requested_time, conversation_id, created_at,
      customer:profiles!customer_id(display_name, first_name, last_name),
      business_service:business_services(name)
    `)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: any) => {
    const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer;
    const name = customer?.display_name
      || [customer?.first_name, customer?.last_name].filter(Boolean).join(" ")
      || "Customer";

    return {
      id: row.id,
      customerName: name.trim() || "Customer",
      customerEmail: null,
      customerPhone: null,
      requestType: row.request_type,
      serviceName: row.business_service?.name ?? null,
      status: row.status,
      notes: row.notes,
      requestedDate: row.requested_date,
      requestedTime: row.requested_time,
      conversationId: row.conversation_id,
      createdAt: row.created_at,
    };
  });
}

export async function updateRequestStatus(
  businessId: string,
  requestId: string,
  status: string,
): Promise<{ error?: string }> {
  if (!await isMemberOf(businessId)) {
    return { error: "Not authorized." };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("service_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("business_id", businessId);

  if (error) return { error: "Failed to update request." };
  return {};
}
