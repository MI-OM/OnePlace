import { NextResponse } from "next/server";
import { embedAllBusinesses } from "@/lib/search/embeddings";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/embed-all
 *
 * Batch-embed all active businesses. Requires admin session.
 * embedAllBusinesses() uses the service-role client internally.
 */
export async function POST() {
  const supabase = await createClient();

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
