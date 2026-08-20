import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const body = await request.json();
  const { entityType, action, days } = body ?? {};

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
  if (action) query = query.ilike("action", `%${action}%`);
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte("created_at", since.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}
