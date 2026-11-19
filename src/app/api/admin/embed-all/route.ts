import { NextResponse } from "next/server";
import { embedAllBusinesses } from "@/lib/search/embeddings";
import { AuthzError, requirePlatformAdmin } from "@/lib/authz";

/**
 * POST /api/admin/embed-all
 *
 * Batch-embed all active businesses. Platform admins only (roles live in
 * user_roles; profiles has no role column). embedAllBusinesses() uses the
 * service-role client internally.
 */
export async function POST() {
  try {
    await requirePlatformAdmin();
  } catch (e) {
    const status = e instanceof AuthzError ? e.status : 403;
    return NextResponse.json({ error: "Admin only" }, { status });
  }

  const result = await embedAllBusinesses();
  return NextResponse.json(result);
}
