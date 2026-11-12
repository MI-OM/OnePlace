import { NextRequest, NextResponse } from "next/server";
import { declineVoiceCall } from "@/lib/voice";
import { readSessionId, voiceErrorResponse } from "@/lib/voice-route";

/**
 * POST /api/voice/decline
 * A member of the conversation's business declines a pending voice call.
 */
export async function POST(request: NextRequest) {
  const sessionId = await readSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }
  try {
    await declineVoiceCall(sessionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return voiceErrorResponse(e, "decline");
  }
}
