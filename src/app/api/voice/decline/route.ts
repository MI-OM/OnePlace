import { NextRequest, NextResponse } from "next/server";
import { declineVoiceCall } from "@/lib/voice";

/**
 * POST /api/voice/decline
 * Staff member declines a pending voice call.
 */
export async function POST(request: NextRequest) {
  let body: { sessionId?: string; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.sessionId || !body.conversationId) {
    return NextResponse.json(
      { error: "sessionId and conversationId are required." },
      { status: 400 },
    );
  }

  try {
    await declineVoiceCall(body.sessionId, body.conversationId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
