import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activateVoiceSession } from "@/lib/voice";

/**
 * POST /api/voice/request
 * Customer marks their voice session as ready (status: created).
 * The actual "pending" status was set during session creation.
 * This just confirms the customer is waiting.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.sessionId) {
    return NextResponse.json(
      { error: "sessionId is required." },
      { status: 400 },
    );
  }

  // Verify session exists and is in pending state
  const service = (await import("@/lib/supabase/service")).createServiceClient();
  const { data: session } = await service
    .from("voice_sessions")
    .select("id, status, conversation_id")
    .eq("id", body.sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (session.status !== "pending") {
    return NextResponse.json({ ok: true }); // already processed
  }

  return NextResponse.json({ ok: true });
}
