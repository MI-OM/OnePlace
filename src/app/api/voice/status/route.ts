import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/voice/status?sessionId=xxx
 * Poll for current voice session status.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId query param is required." },
      { status: 400 },
    );
  }

  const service = createServiceClient();
  const { data: session } = await service
    .from("voice_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ status: session.status });
}
