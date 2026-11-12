import { NextRequest, NextResponse } from "next/server";
import { authorizeVoiceSession } from "@/lib/voice";
import { voiceErrorResponse } from "@/lib/voice-route";

/**
 * GET /api/voice/status?sessionId=xxx
 * Poll for current voice session status (participants only).
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId query param is required." },
      { status: 400 },
    );
  }
  try {
    const { session } = await authorizeVoiceSession(sessionId);
    return NextResponse.json({ status: session.status });
  } catch (e) {
    return voiceErrorResponse(e, "status");
  }
}
