import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { AuthzError, requirePlatformAdmin } from "@/lib/authz";
import { logger } from "@/lib/logger";

const filterSchema = z.object({
  entityType: z.string().max(64).optional(),
  action: z.string().max(64).optional(),
  days: z.coerce.number().int().min(1).max(3650).optional(),
});

/** POST /api/admin/audit-logs — platform admins only. */
export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();
  } catch (e) {
    const status = e instanceof AuthzError ? e.status : 403;
    return NextResponse.json({ error: "Admin access required." }, { status });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    raw = {};
  }
  const parsed = filterSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filters." }, { status: 400 });
  }
  const { entityType, action, days } = parsed.data;

  const service = createServiceClient();
  let query = service
    .from("audit_logs")
    .select(
      `id, action, entity_type, entity_id, old_values, new_values,
       actor_user_id, business_id, ip_address, created_at`,
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  if (entityType) query = query.eq("entity_type", entityType);
  if (action) {
    const escaped = action.replace(/[\\%_]/g, (c) => "\\" + c);
    query = query.ilike("action", `%${escaped}%`);
  }
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte("created_at", since.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    logger.error("audit-logs query failed", { error: error.message });
    return NextResponse.json({ error: "Could not load audit logs." }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}
