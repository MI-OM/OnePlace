import { loadBusinessContext } from "@/lib/ai/context";
import { getAIProvider } from "@/lib/ai/provider";
import { buildAssistantMessages } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderUserId: string | null;
  senderType: "customer" | "business_staff" | "ai_agent" | "system";
  messageType: "text" | "system" | "file" | "voice";
  content: string | null;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
};

const ACTIVE_STATUSES = [
  "new",
  "active",
  "waiting",
  "human_requested",
  "human_connected",
];

async function currentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Please sign in to continue.");
  }
  return user.id;
}

function mapMessage(row: {
  id: string;
  conversation_id: string;
  sender_user_id: string | null;
  sender_type: string;
  message_type: string;
  content: string | null;
  created_at: string;
}): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderUserId: row.sender_user_id,
    senderType: row.sender_type as ConversationMessage["senderType"],
    messageType: row.message_type as ConversationMessage["messageType"],
    content: row.content,
    createdAt: row.created_at,
  };
}

/**
 * Finds an existing active conversation for (customer, business) or creates
 * one, then writes the AI greeting (Doc 13 §15, §16, §20).
 */
export async function findOrCreateConversation(
  businessId: string,
): Promise<{ id: string }> {
  const userId = await currentUserId();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("business_id", businessId)
    .eq("customer_id", userId)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { id: existing.id };
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ business_id: businessId, customer_id: userId, status: "new" })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error("We couldn't start a conversation. Please try again.");
  }

  await supabase
    .from("conversations")
    .update({ status: "active" })
    .eq("id", created.id);

  const context = await loadBusinessContext(businessId);
  const service = createServiceClient();
  await service.from("messages").insert({
    conversation_id: created.id,
    sender_type: "ai_agent",
    message_type: "text",
    content:
      context.greeting ??
      `Hi! You're chatting with ${context.name}. What can we help you with?`,
  });

  return { id: created.id };
}

export async function getConversationForCustomer(
  conversationId: string,
): Promise<{
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  status: string;
  createdAt: string;
} | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, business_id, status, created_at, business:businesses(id, name, slug)",
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const business = (
    Array.isArray(data.business) ? data.business[0] : data.business
  ) as { id: string; name: string; slug: string } | null;
  if (!business) {
    return null;
  }

  return {
    id: data.id,
    businessId: business.id,
    businessName: business.name,
    businessSlug: business.slug,
    status: data.status,
    createdAt: data.created_at,
  };
}

export async function getMessagesForConversation(
  conversationId: string,
): Promise<ConversationMessage[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  return (data ?? []).map(mapMessage);
}

export async function getMyConversations(): Promise<ConversationSummary[]> {
  const userId = await currentUserId();
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, business_id, status, created_at, updated_at, business:businesses(id, name, slug)",
    )
    .eq("customer_id", userId)
    .order("updated_at", { ascending: false });

  const summaries: ConversationSummary[] = [];

  for (const conversation of data ?? []) {
    const business = (
      Array.isArray(conversation.business)
        ? conversation.business[0]
        : conversation.business
    ) as { id: string; name: string; slug: string } | null;
    if (!business) continue;

    const { data: lastMessages } = await supabase
      .from("messages")
      .select("content, sender_type")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const last = lastMessages?.[0];
    const lastMessage =
      last && last.sender_type !== "system" && last.content
        ? last.content
        : null;

    summaries.push({
      id: conversation.id,
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      status: conversation.status,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      lastMessage,
    });
  }

  return summaries;
}

/**
 * Sends a customer message and, when appropriate, triggers the AI reply
 * (Doc 14 §35–39). Customer inserts go through the user client (RLS);
 * AI messages are inserted with the service-role client because they have
 * no sender user.
 */
export async function sendCustomerMessage(
  conversationId: string,
  content: string,
): Promise<{ ok: true }> {
  const userId = await currentUserId();
  const supabase = await createClient();

  const { data: conversation, error: fetchError } = await supabase
    .from("conversations")
    .select("id, business_id, status")
    .eq("id", conversationId)
    .maybeSingle();

  if (fetchError || !conversation) {
    throw new Error("This conversation isn't available.");
  }

  if (conversation.status === "closed") {
    throw new Error("This conversation has ended.");
  }

  if (conversation.status === "new") {
    await supabase
      .from("conversations")
      .update({ status: "active" })
      .eq("id", conversationId);
  }

  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: userId,
    sender_type: "customer",
    message_type: "text",
    content,
  });

  if (insertError) {
    throw new Error("Message failed to send.");
  }

  const context = await loadBusinessContext(conversation.business_id);
  const shouldReply =
    context.aiEnabled && conversation.status !== "human_connected";

  if (shouldReply) {
    await generateAIReply(
      conversationId,
      context,
      content,
    );
  }

  return { ok: true };
}

async function generateAIReply(
  conversationId: string,
  businessContext: Awaited<ReturnType<typeof loadBusinessContext>>,
  customerMessage: string,
): Promise<void> {
  const supabase = await createClient();
  const service = createServiceClient();

  const { data: history } = await supabase
    .from("messages")
    .select("sender_type, content")
    .eq("conversation_id", conversationId)
    .in("sender_type", ["customer", "ai_agent"])
    .order("created_at", { ascending: false })
    .limit(12);

  const historyMessages = (history ?? [])
    .slice()
    .reverse()
    .flatMap((row): { role: "user" | "assistant"; content: string }[] => {
      if (!row.content) return [];
      return [
        {
          role: row.sender_type === "customer" ? "user" : "assistant",
          content: row.content,
        },
      ];
    });

  const provider = getAIProvider();
  const completion = await provider.generateReply(
    buildAssistantMessages({
      businessName: businessContext.name,
      personality: businessContext.personality,
      context: businessContext.context,
      history: historyMessages,
      customerMessage,
    }),
  );

  if (!completion.content) {
    return;
  }

  await service.from("messages").insert({
    conversation_id: conversationId,
    sender_type: "ai_agent",
    message_type: "text",
    content: completion.content,
  });
}

export async function requestHumanHandoff(
  conversationId: string,
): Promise<{ ok: true }> {
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("status")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation || conversation.status === "closed") {
    throw new Error("This conversation has ended.");
  }

  if (conversation.status !== "human_requested") {
    await supabase
      .from("conversations")
      .update({ status: "human_requested" })
      .eq("id", conversationId);
  }

  const service = createServiceClient();
  await service.from("messages").insert({
    conversation_id: conversationId,
    sender_type: "system",
    message_type: "system",
    content:
      "We've let the team know you'd like to talk. Someone will join when available — you can keep chatting here or leave a message.",
  });

  return { ok: true };
}

export async function closeCustomerConversation(
  conversationId: string,
): Promise<{ ok: true }> {
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("status")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation || conversation.status === "closed") {
    throw new Error("This conversation has ended.");
  }

  await supabase
    .from("conversations")
    .update({ status: "closed", ended_at: new Date().toISOString() })
    .eq("id", conversationId);

  const service = createServiceClient();
  await service.from("messages").insert({
    conversation_id: conversationId,
    sender_type: "system",
    message_type: "system",
    content:
      "Conversation closed. If you need anything else, you can start a new conversation.",
  });

  return { ok: true };
}
