import { NextRequest, NextResponse } from "next/server";
import { timeoutVoiceCall } from "@/lib/voice";
import { readSessionId, voiceErrorResponse } from "@/lib/voice-route";

/**
 * POST /api/voice/timeout
 * The customer's client reports that the 60-second wait has expired.
 */
export async function POST(request: NextRequest) {
  const sessionId = await readSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }
  try {
    await timeoutVoiceCall(sessionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return voiceErrorResponse(e, "timeout");
  }
}
