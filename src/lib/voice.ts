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
  const { data: profile } = await service
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

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
  conversationId: string,
): Promise<{ roomName: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");

  const service = createServiceClient();

  const { data: session } = await service
    .from("voice_sessions")
    .select("id, status, livekit_room_name, conversation_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) throw new Error("Session not found.");
  if (session.status !== "pending") {
    throw new Error("This call is no longer waiting.");
  }
  if (session.conversation_id !== conversationId) {
    throw new Error("Session does not match this conversation.");
  }

  // Get staff name
  const { data: profile } = await service
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await service
    .from("voice_sessions")
    .update({
      status: "connecting",
      started_at: new Date().toISOString(),
      metadata: {
        ...(session as any).metadata,
        accepted_by: user.id,
        accepted_by_name: profile?.full_name ?? "Staff",
      },
    })
    .eq("id", sessionId)
    .eq("status", "pending");

  if (error) throw new Error("Failed to accept call.");

  // Log system message
  await service.from("messages").insert({
    conversation_id: conversationId,
    sender_type: "system",
    message_type: "text",
    content: `📞 ${profile?.full_name ?? "Team member"} joined the call.`,
  });

  return { roomName: session.livekit_room_name };
}

/**
 * Staff member declines a voice call.
 */
export async function declineVoiceCall(
  sessionId: string,
  conversationId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");

  const service = createServiceClient();

  const { data: session } = await service
    .from("voice_sessions")
    .select("id, status, conversation_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.status !== "pending") return;

  await service
    .from("voice_sessions")
    .update({ status: "declined", ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  await service.from("messages").insert({
    conversation_id: conversationId,
    sender_type: "system",
    message_type: "text",
    content: "📞 Voice call declined — the team is currently unavailable.",
  });
}

/**
 * Time out a voice call after 60 seconds (called from client-side timer).
 */
export async function timeoutVoiceCall(
  sessionId: string,
  conversationId: string,
): Promise<void> {
  const service = createServiceClient();

  const { data: session } = await service
    .from("voice_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.status !== "pending") return;

  await service
    .from("voice_sessions")
    .update({
      status: "timed_out",
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  await service.from("messages").insert({
    conversation_id: conversationId,
    sender_type: "system",
    message_type: "text",
    content: "📞 Call not connected — no team member responded. Try again later or send a message.",
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
 * Ends a voice session, updating status and duration. Logs outcome in chat.
 */
export async function endVoiceSession(
  sessionId: string,
  conversationId?: string,
): Promise<void> {
  const service = createServiceClient();

  const { data: session } = await service
    .from("voice_sessions")
    .select("id, status, started_at, conversation_id, metadata")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.status === "ended") return;

  const now = new Date();
  const durationSeconds = session.started_at
    ? Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000)
    : null;

  await service
    .from("voice_sessions")
    .update({
      status: "ended",
      ended_at: now.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", sessionId);

  // Log outcome
  const convId = conversationId ?? session.conversation_id;
  if (convId) {
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
      conversation_id: convId,
      sender_type: "system",
      message_type: "text",
      content: logMessage,
    });
  }
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
