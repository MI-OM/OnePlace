import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Autocomplete API — fast prefix search for search-as-you-type.
 * Returns matching business names + categories in <50ms.
 * No embeddings needed — pure prefix match on existing data.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const service = createServiceClient();

  const { data, error } = await service.rpc("autocomplete_businesses", {
    prefix: q,
    match_limit: 8,
  });

  if (error) {
    console.error("Autocomplete error:", error.message);
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}
