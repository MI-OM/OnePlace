import { NextRequest, NextResponse } from "next/server";
import { acceptVoiceCall } from "@/lib/voice";
import { readSessionId, voiceErrorResponse } from "@/lib/voice-route";

/**
 * POST /api/voice/accept
 * A member of the conversation's business accepts a pending voice call.
 */
export async function POST(request: NextRequest) {
  const sessionId = await readSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }
  try {
    const { roomName } = await acceptVoiceCall(sessionId);
    return NextResponse.json({ ok: true, roomName });
  } catch (e) {
    return voiceErrorResponse(e, "accept");
  }
}
