import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type VoiceSession = {
  id: string;
  conversationId: string;
  roomName: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  requestedBy: string | null;
  requestedByName: string | null;
};

export type VoiceRole = "customer" | "staff";

export class VoiceAuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new VoiceAuthError("Please sign in.", 401);
  return user.id;
}

/**
 * Returns the caller's role in a conversation ("customer" if they own it,
 * "staff" if they are an active member of its business), or null otherwise.
 * Every voice endpoint must pass this check before touching a session.
 */
export async function getVoiceParticipantRole(
  userId: string,
  conversationId: string,
): Promise<VoiceRole | null> {
  const service = createServiceClient();
  const { data: conversation } = await service
    .from("conversations")
    .select("customer_id, business_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) return null;
  if (conversation.customer_id === userId) return "customer";
  if (!conversation.business_id) return null;

  const { data: member } = await service
    .from("business_members")
    .select("user_id")
    .eq("business_id", conversation.business_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return member ? "staff" : null;
}

/**
 * Loads a voice session and checks that the signed-in caller takes part in
 * its conversation, optionally with a specific role.
 */
export async function authorizeVoiceSession(
  sessionId: string,
  requiredRole?: VoiceRole,
) {
  const userId = await requireUserId();
  const service = createServiceClient();
  const { data: session } = await service
    .from("voice_sessions")
    .select(
      "id, status, livekit_room_name, conversation_id, started_at, metadata",
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) throw new VoiceAuthError("Session not found.", 404);

  const role = await getVoiceParticipantRole(userId, session.conversation_id);
  if (!role || (requiredRole && role !== requiredRole)) {
    throw new VoiceAuthError("You are not part of this call.", 403);
  }
  return { userId, role, session };
}

/** Best display name for a profile (the table has no full_name column). */
export async function getDisplayName(userId: string): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("display_name, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  const full = [data.first_name, data.last_name].filter(Boolean).join(" ");
  return data.display_name || full || null;
}

/**
 * Customer requests a voice call. Creates a session with status "pending"
 * and logs a system message in the conversation.
 */
export async function requestVoiceCall(
  conversationId: string,
): Promise<{ sessionId: string; roomName: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, customer_id, business_id, status")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) throw new Error("Conversation not found.");
  if (conversation.customer_id !== user.id) {
    throw new Error("Not your conversation.");
  }
  if (conversation.status === "closed") {
    throw new Error("This conversation has ended.");
  }

  const service = createServiceClient();

  // Check voice is enabled
  const { data: config } = await service
    .from("ai_configurations")
    .select("voice_enabled")
    .eq("business_id", conversation.business_id)
    .maybeSingle();

  if (!config?.voice_enabled) {
    throw new Error("Voice is not enabled for this business.");
  }

  // Check no active/pending session exists
  const { data: existing } = await service
    .from("voice_sessions")
    .select("id, status")
    .eq("conversation_id", conversationId)
    .in("status", ["pending", "created", "connecting", "active"])
    .maybeSingle();

  if (existing) {
    throw new Error("A voice call is already in progress.");
  }

  // Get customer name for display
  const profile = { full_name: await getDisplayName(user.id) };

  const roomName = `op-${conversationId.slice(0, 8)}-${Date.now()}`;

  const { data: session, error } = await service
    .from("voice_sessions")
    .insert({
      conversation_id: conversationId,
      livekit_room_name: roomName,
      status: "pending",
      started_at: null,
      metadata: {
        requested_by: user.id,
        requested_by_name: profile?.full_name ?? user.email ?? "Customer",
      },
    })
    .select("id")
    .single();

  if (error || !session) {
    throw new Error("Failed to create voice session.");
  }

  // Log system message
  await service.from("messages").insert({
    conversation_id: conversationId,
    sender_type: "system",
    message_type: "text",
    content: `📞 Voice call requested by ${profile?.full_name ?? "customer"}. Waiting for a team member to join…`,
  });

  // Notify all business members
  const { data: members } = await service
    .from("business_members")
    .select("user_id")
    .eq("business_id", conversation.business_id);

  if (members && members.length > 0) {
    const notifications = members.map((m) => ({
      user_id: m.user_id,
      type: "voice_call_request",
      title: "Incoming voice call",
      body: `${profile?.full_name ?? "A customer"} wants to start a voice call.`,
      data: {
        conversation_id: conversationId,
        session_id: session.id,
        room_name: roomName,
      },
    }));
    await service.from("notifications").insert(notifications);
  }

  return { sessionId: session.id, roomName };
}

/**
 * Staff member accepts a voice call. Changes status to "connecting".
 */
export async function acceptVoiceCall(
  sessionId: string,
): Promise<{ roomName: string }> {
  const { userId, session } = await authorizeVoiceSession(sessionId, "staff");
  if (session.status !== "pending") {
    throw new VoiceAuthError("This call is no longer waiting.", 409);
  }

  const service = createServiceClient();
  const staffName = (await getDisplayName(userId)) ?? "Staff";

  const { data: updated, error } = await service
    .from("voice_sessions")
    .update({
      status: "connecting",
      started_at: new Date().toISOString(),
      metadata: {
        ...((session.metadata ?? {}) as Record<string, unknown>),
        accepted_by: userId,
        accepted_by_name: staffName,
      },
    })
    .eq("id", sessionId)
    .eq("status", "pending")
    .select("id");

  if (error) throw new Error("Failed to accept call.");
  if (!updated || updated.length === 0) {
    throw new VoiceAuthError("Another team member already took this call.", 409);
  }

  await service.from("messages").insert({
    conversation_id: session.conversation_id,
    sender_type: "system",
    message_type: "text",
    content: `📞 ${staffName} joined the call.`,
  });

  return { roomName: session.livekit_room_name };
}

/**
 * Staff member declines a voice call.
 */
export async function declineVoiceCall(sessionId: string): Promise<void> {
  const { session } = await authorizeVoiceSession(sessionId, "staff");
  if (session.status !== "pending") return;

  const service = createServiceClient();
  const { data: updated } = await service
    .from("voice_sessions")
    .update({ status: "declined", ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "pending")
    .select("id");
  if (!updated || updated.length === 0) return;

  await service.from("messages").insert({
    conversation_id: session.conversation_id,
    sender_type: "system",
    message_type: "text",
    content: "📞 Voice call declined — the team is currently unavailable.",
  });
}

/**
 * Times out a pending voice call (called from the customer's 60-second timer).
 */
export async function timeoutVoiceCall(sessionId: string): Promise<void> {
  const { session } = await authorizeVoiceSession(sessionId);
  if (session.status !== "pending") return;

  const service = createServiceClient();
  const { data: updated } = await service
    .from("voice_sessions")
    .update({
      status: "timed_out",
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("status", "pending")
    .select("id");
  if (!updated || updated.length === 0) return;

  await service.from("messages").insert({
    conversation_id: session.conversation_id,
    sender_type: "system",
    message_type: "text",
    content:
      "📞 Call not connected — no team member responded. Try again later or send a message.",
  });
}

/**
 * Marks a voice session as active (called when both participants join).
 */
export async function activateVoiceSession(sessionId: string): Promise<void> {
  const service = createServiceClient();
  await service
    .from("voice_sessions")
    .update({ status: "active" })
    .eq("id", sessionId)
    .in("status", ["connecting", "created"]);
}

/**
 * Ends a voice session, updating status and duration, and logs the outcome
 * in chat. Only a participant (the customer or business staff) may end it.
 */
export async function endVoiceSession(sessionId: string): Promise<void> {
  const { session } = await authorizeVoiceSession(sessionId);
  if (session.status === "ended") return;

  const service = createServiceClient();
  const now = new Date();
  const durationSeconds = session.started_at
    ? Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000)
    : null;

  const { data: updated } = await service
    .from("voice_sessions")
    .update({
      status: "ended",
      ended_at: now.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", sessionId)
    .neq("status", "ended")
    .select("id");
  // Both sides call this on hang-up; only the first one logs the outcome.
  if (!updated || updated.length === 0) return;

  const meta = (session.metadata ?? {}) as Record<string, string>;
  const wasConnected = ["active", "connecting"].includes(session.status);

  let logMessage: string;
  if (wasConnected && durationSeconds != null) {
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const dur = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    logMessage = `📞 Call ended — Duration: ${dur}`;
    if (meta.accepted_by_name) {
      logMessage += ` with ${meta.accepted_by_name}`;
    }
  } else {
    logMessage = "📞 Call ended — not connected.";
  }

  await service.from("messages").insert({
    conversation_id: session.conversation_id,
    sender_type: "system",
    message_type: "text",
    content: logMessage,
  });
}

/**
 * Gets the active/pending voice session for a conversation.
 */
export async function getActiveVoiceSession(
  conversationId: string,
): Promise<VoiceSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("voice_sessions")
    .select("id, conversation_id, livekit_room_name, status, started_at, ended_at, duration_seconds, metadata")
    .eq("conversation_id", conversationId)
    .in("status", ["pending", "created", "connecting", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const meta = (data.metadata ?? {}) as Record<string, string>;

  return {
    id: data.id,
    conversationId: data.conversation_id,
    roomName: data.livekit_room_name ?? "",
    status: data.status,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    durationSeconds: data.duration_seconds,
    requestedBy: meta.requested_by ?? null,
    requestedByName: meta.requested_by_name ?? null,
  };
}

/**
 * Gets pending voice session for a conversation (for staff to accept/decline).
 */
export async function getPendingVoiceSession(
  conversationId: string,
): Promise<VoiceSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("voice_sessions")
    .select("id, conversation_id, livekit_room_name, status, started_at, ended_at, duration_seconds, metadata")
    .eq("conversation_id", conversationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const meta = (data.metadata ?? {}) as Record<string, string>;

  return {
    id: data.id,
    conversationId: data.conversation_id,
    roomName: data.livekit_room_name ?? "",
    status: data.status,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    durationSeconds: data.duration_seconds,
    requestedBy: meta.requested_by ?? null,
    requestedByName: meta.requested_by_name ?? null,
  };
}
