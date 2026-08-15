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
