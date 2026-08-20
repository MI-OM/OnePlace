import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/voice/pending?conversationId=xxx
 * Returns pending voice session info for a conversation (staff use).
 */
export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId query param is required." },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  const { data: session } = await service
    .from("voice_sessions")
    .select("id, status, metadata")
    .eq("conversation_id", conversationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ sessionId: null });
  }

  const meta = (session.metadata ?? {}) as Record<string, string>;

  return NextResponse.json({
    sessionId: session.id,
    requestedByName: meta.requested_by_name ?? "Customer",
  });
}
