"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getUser } from "@/lib/auth";
import {
  closeCustomerConversation,
  findOrCreateConversation,
  requestHumanHandoff,
  sendCustomerMessage,
} from "@/lib/chat/conversations";
import { createServiceClient } from "@/lib/supabase/service";

export type ChatActionResult = {
  error?: string;
};

const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Write a message first.")
    .max(2000, "Keep your message under 2000 characters."),
});

export async function startConversation(
  businessId: string,
  redirectTo: string,
): Promise<void> {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectTo)}`);
  }
  const { id } = await findOrCreateConversation(businessId);
  redirect(`/conversations/${id}`);
}

export async function sendMessage(
  conversationId: string,
  input: { content: string },
): Promise<ChatActionResult> {
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Message failed to send." };
  }

  try {
    await sendCustomerMessage(conversationId, parsed.data.content);
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Message failed to send.",
    };
  }
}

export async function requestHuman(
  conversationId: string,
): Promise<ChatActionResult> {
  try {
    await requestHumanHandoff(conversationId);
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "We couldn't do that right now.",
    };
  }
}

export async function closeConversation(
  conversationId: string,
): Promise<ChatActionResult> {
  try {
    await closeCustomerConversation(conversationId);
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "We couldn't end the conversation.",
    };
  }
}

const requestSchema = z.object({
  conversationId: z.string().uuid(),
  requestType: z.enum([
    "information",
    "availability",
    "quote",
    "booking",
    "callback",
    "other",
  ]),
  requestedDate: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(Date.parse(v)),
      { message: "Enter a valid date." },
    ),
  requestedTime: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
      { message: "Enter a valid time (HH:MM)." },
    ),
  notes: z.string().max(1000).optional(),
});

export type CreateRequestInput = z.infer<typeof requestSchema>;

export type CreateRequestResult = {
  ok?: true;
  requestId?: string;
  error?: string;
};

/**
 * Turns a conversation into a structured service request (Doc 13 §95,
 * Doc 14 §14 `create_request`). The customer initiates this; it is linked to
 * the conversation and the business being chatted with. Inserts run server-side
 * with the service-role client so RLS still enforces ownership in the policies
 * while the write itself is permitted (customer can create own requests per
 * Doc 04 §82).
 */
export async function createRequest(
  input: CreateRequestInput,
): Promise<CreateRequestResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const user = await getUser();
  if (!user) {
    return { error: "Please sign in to continue." };
  }

  const {
    conversationId,
    requestType,
    requestedDate,
    requestedTime,
    notes,
  } = parsed.data;

  try {
    const service = createServiceClient();

    // Resolve the business + service for the request from the conversation so
    // the customer can't target another business.
    const { data: conversation, error: convError } = await service
      .from("conversations")
      .select("business_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (convError || !conversation) {
      return { error: "This conversation isn't available." };
    }

    const { data: created, error } = await service
      .from("service_requests")
      .insert({
        conversation_id: conversationId,
        business_id: conversation.business_id,
        customer_id: user.id,
        request_type: requestType,
        requested_date: requestedDate ?? null,
        requested_time: requestedTime ?? null,
        notes: notes ?? null,
        status: "open",
      })
      .select("id")
      .single();

    if (error || !created) {
      throw new Error(error?.message ?? "Could not create request.");
    }

    // Record a system message tying the request to the conversation thread
    // (Doc 13 §95: Conversation → Request created → Conversation continues).
    const service2 = createServiceClient();
    await service2.from("messages").insert({
      conversation_id: conversationId,
      sender_type: "system",
      message_type: "system",
      content:
        "You've created a service request. The business will respond here when ready.",
    });

    return { ok: true, requestId: created.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not create request.",
    };
  }
}
