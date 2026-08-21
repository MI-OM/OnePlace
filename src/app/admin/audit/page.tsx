import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Audit Log — Admin" };

export default async function AuditLogPage() {
  const user = await getUser();
  if (!user) notFound();

  const service = createServiceClient();
  const { data: role } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "platform_admin")
    .maybeSingle();

  if (!role) notFound();

  const { data: logs } = await service
    .from("audit_logs")
    .select(
      `id, action, entity_type, entity_id, old_values, new_values,
       actor_user_id, business_id, ip_address, created_at`,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <Button render={<Link href="/admin" />} variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Admin panel
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        System changes for compliance and disaster recovery.
      </p>

      <AuditLogViewer initialLogs={logs ?? []} />
    </main>
  );
}
