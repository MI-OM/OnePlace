import { NextRequest, NextResponse } from "next/server";
import { endVoiceSession } from "@/lib/voice";
import { readSessionId, voiceErrorResponse } from "@/lib/voice-route";

/**
 * POST /api/voice/end
 * A participant (customer or business staff) hangs up.
 */
export async function POST(request: NextRequest) {
  const sessionId = await readSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }
  try {
    await endVoiceSession(sessionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return voiceErrorResponse(e, "end");
  }
}
