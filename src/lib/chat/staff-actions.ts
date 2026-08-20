"use server";

import { z } from "zod";

import { getUser } from "@/lib/auth";
import { isMemberOf } from "@/lib/chat/staff";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const staffMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Write a message first.")
    .max(2000, "Keep your message under 2000 characters."),
});

export type StaffSendResult = {
  error?: string;
};

/**
 * Sends a message as the business on behalf of a staff member, then marks
 * the conversation as human-connected so the AI stops replying. The insert
 * and status update go through the user client so RLS enforces that the
 * caller is a participant / member of the business.
 */
export async function sendStaffMessage(
  conversationId: string,
  input: { content: string },
): Promise<StaffSendResult> {
  const parsed = staffMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Message failed to send." };
  }

  const user = await getUser();
  if (!user) {
    return { error: "Please sign in to continue." };
  }

  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, business_id, status")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation?.business_id) {
    return { error: "This conversation isn't available." };
  }
  if (!(await isMemberOf(conversation.business_id))) {
    return { error: "You don't have access to this conversation." };
  }
  if (conversation.status === "closed") {
    return { error: "This conversation has ended." };
  }

  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    sender_type: "business_staff",
    message_type: "text",
    content: parsed.data.content,
  });
  if (insertError) {
    return { error: "Message failed to send." };
  }

  if (conversation.status !== "human_connected") {
    await supabase
      .from("conversations")
      .update({ status: "human_connected" })
      .eq("id", conversationId);

    const service = createServiceClient();
    await service.from("messages").insert({
      conversation_id: conversationId,
      sender_type: "system",
      message_type: "system",
      content: "A team member has joined the conversation.",
    });
  }

  return {};
}
