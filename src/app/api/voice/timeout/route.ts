import { NextRequest, NextResponse } from "next/server";
import { timeoutVoiceCall } from "@/lib/voice";

/**
 * POST /api/voice/timeout
 * Client reports that the 60-second wait has expired.
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
    await timeoutVoiceCall(body.sessionId, body.conversationId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
