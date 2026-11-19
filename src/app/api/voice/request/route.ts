import { NextRequest, NextResponse } from "next/server";
import { authorizeVoiceSession } from "@/lib/voice";
import { readSessionId, voiceErrorResponse } from "@/lib/voice-route";

/**
 * POST /api/voice/request
 * The customer confirms they are waiting on their pending voice session.
 * The "pending" status itself is set when the session is created.
 */
export async function POST(request: NextRequest) {
  const sessionId = await readSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }
  try {
    await authorizeVoiceSession(sessionId, "customer");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return voiceErrorResponse(e, "request");
  }
}
