import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getVoiceParticipantRole } from "@/lib/voice";

/**
 * GET /api/voice/pending?conversationId=xxx
 * Returns the pending voice session for a conversation. Only members of the
 * conversation's business may see it (they are the ones who answer).
 */
export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId query param is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  if ((await getVoiceParticipantRole(user.id, conversationId)) !== "staff") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
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
