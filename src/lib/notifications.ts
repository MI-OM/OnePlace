import { createServiceClient } from "@/lib/supabase/service";

/**
 * Creates an in-app notification for a user (Doc 14 §110, G3).
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const service = createServiceClient();
  await service.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data ?? {},
  });
};

/**
 * Notifies business members when a request status changes.
 */
export async function notifyRequestStatusChange(params: {
  businessId: string;
  requestId: string;
  requestType: string;
  oldStatus: string;
  newStatus: string;
  customerId: string;
}): Promise<void> {
  const service = createServiceClient();

  const { data: members } = await service
    .from("business_members")
    .select("user_id")
    .eq("business_id", params.businessId)
    .eq("status", "active");

  const labels: Record<string, string> = {
    pending: "is pending",
    accepted: "was accepted",
    declined: "was declined",
    completed: "was completed",
    cancelled: "was cancelled",
  };

  const statusLabel = labels[params.newStatus] ?? `changed to ${params.newStatus}`;

  for (const member of members ?? []) {
    await createNotification({
      userId: member.user_id,
      type: "request_status_change",
      title: `Request ${statusLabel}`,
      body: `A ${params.requestType} request ${statusLabel}.`,
      data: { requestId: params.requestId, businessId: params.businessId },
    });
  }
};

/**
 * Notifies a customer when their request status changes.
 */
export async function notifyCustomerRequestUpdate(params: {
  customerId: string;
  requestId: string;
  businessName: string;
  requestType: string;
  newStatus: string;
}): Promise<void> {
  const labels: Record<string, string> = {
    accepted: "was accepted",
    declined: "was declined",
    completed: "was completed",
  };

  const statusLabel = labels[params.newStatus] ?? `updated to ${params.newStatus}`;

  await createNotification({
    userId: params.customerId,
    type: "request_status_change",
    title: `${params.businessName}: request ${statusLabel}`,
    body: `Your ${params.requestType} request ${statusLabel}.`,
    data: { requestId: params.requestId },
  });
};

/**
 * Notifies business members when a human handoff is requested.
 */
export async function notifyHumanHandoff(params: {
  businessId: string;
  conversationId: string;
  customerName: string;
}): Promise<void> {
  const service = createServiceClient();

  const { data: members } = await service
    .from("business_members")
    .select("user_id")
    .eq("business_id", params.businessId)
    .eq("status", "active");

  for (const member of members ?? []) {
    await createNotification({
      userId: member.user_id,
      type: "human_handoff",
      title: "Customer wants to talk",
      body: `${params.customerName} is requesting to speak with a team member.`,
      data: { conversationId: params.conversationId, businessId: params.businessId },
    });
  }
}

/**
 * Notifies business members when a new message arrives in a conversation.
 */
export async function notifyNewMessage(params: {
  businessId: string;
  conversationId: string;
  customerName: string;
}): Promise<void> {
  const service = createServiceClient();

  const { data: members } = await service
    .from("business_members")
    .select("user_id")
    .eq("business_id", params.businessId)
    .eq("status", "active");

  for (const member of members ?? []) {
    await createNotification({
      userId: member.user_id,
      type: "new_message",
      title: "New message",
      body: `${params.customerName} sent a new message.`,
      data: { conversationId: params.conversationId, businessId: params.businessId },
    });
  }
};

/**
 * Notifies business members when an incoming voice call is received.
 */
export async function notifyVoiceCall(params: {
  businessId: string;
  conversationId: string;
  customerName: string;
}): Promise<void> {
  const service = createServiceClient();

  const { data: members } = await service
    .from("business_members")
    .select("user_id")
    .eq("business_id", params.businessId)
    .eq("status", "active");

  for (const member of members ?? []) {
    await createNotification({
      userId: member.user_id,
      type: "voice_call_request",
      title: "Incoming voice call",
      body: `${params.customerName} is calling.`,
      data: { conversationId: params.conversationId, businessId: params.businessId },
    });
  }
}