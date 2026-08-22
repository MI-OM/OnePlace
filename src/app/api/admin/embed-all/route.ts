import { NextResponse } from "next/server";
import { embedAllBusinesses } from "@/lib/search/embeddings";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/admin/embed-all
 *
 * Batch-embed all active businesses. Call once after migration,
 * then DELETE this file. This is a temporary endpoint.
 *
 * Requires service-role key (server-only).
 */
export async function POST() {
  const supabase = createServiceClient();

  // Verify caller is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const result = await embedAllBusinesses();
  return NextResponse.json(result);
}
