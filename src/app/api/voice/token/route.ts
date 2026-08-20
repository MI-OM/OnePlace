import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY ?? "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET ?? "";
const LIVEKIT_URL = process.env.LIVEKIT_URL ?? "";

export async function POST(request: NextRequest) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return NextResponse.json(
      { error: "Voice is not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const rl = checkRateLimit(`voice:${user.id}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many voice requests. Please wait a moment." },
      { status: 429 },
    );
  }

  let body: { conversationId?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.conversationId) {
    return NextResponse.json(
      { error: "conversationId is required." },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  // If sessionId is provided, this is a staff member joining an existing session
  if (body.sessionId) {
    const { data: session } = await service
      .from("voice_sessions")
      .select("id, status, livekit_room_name, conversation_id")
      .eq("id", body.sessionId)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (session.status !== "connecting" && session.status !== "active") {
      return NextResponse.json({ error: "Session is not in a joinable state." }, { status: 400 });
    }

    const roomName = session.livekit_room_name;

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user.id,
      name: user.email ?? "Team",
      ttl: 60 * 60,
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();
    return NextResponse.json({
      token: jwt,
      url: LIVEKIT_URL,
      roomName,
      sessionId: session.id,
    });
  }

  // Otherwise, customer creating a new session
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, customer_id, business_id, status")
    .eq("id", body.conversationId)
    .maybeSingle();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (conversation.customer_id !== user.id) {
    return NextResponse.json({ error: "Not your conversation." }, { status: 403 });
  }
  if (conversation.status === "closed") {
    return NextResponse.json({ error: "Conversation is closed." }, { status: 400 });
  }

  // Check voice enabled
  const { data: config } = await service
    .from("ai_configurations")
    .select("voice_enabled")
    .eq("business_id", conversation.business_id)
    .maybeSingle();

  if (!config?.voice_enabled) {
    return NextResponse.json({ error: "Voice is not enabled." }, { status: 400 });
  }

  // Check no active session
  const { data: existing } = await service
    .from("voice_sessions")
    .select("id, status")
    .eq("conversation_id", body.conversationId)
    .in("status", ["pending", "created", "connecting", "active"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "A voice call is already in progress." }, { status: 409 });
  }

  // Get customer name
  const { data: profile } = await service
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const roomName = `op-${body.conversationId.slice(0, 8)}-${Date.now()}`;

  const { data: session, error: sessionError } = await service
    .from("voice_sessions")
    .insert({
      conversation_id: body.conversationId,
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

  if (sessionError || !session) {
    return NextResponse.json({ error: "Failed to create voice session." }, { status: 500 });
  }

  // Log system message
  await service.from("messages").insert({
    conversation_id: body.conversationId,
    sender_type: "system",
    message_type: "text",
    content: `📞 Voice call requested by ${profile?.full_name ?? "customer"}. Waiting for a team member to join…`,
  });

  // Notify business members
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
        conversation_id: body.conversationId,
        session_id: session.id,
        room_name: roomName,
      },
    }));
    await service.from("notifications").insert(notifications);
  }

  return NextResponse.json({
    sessionId: session.id,
    roomName,
    status: "pending",
  });
}
