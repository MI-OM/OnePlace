import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Shield, Store } from "lucide-react";

import { getUser } from "@/lib/auth";
import { getMyBusinesses } from "@/lib/chat/staff";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Business dashboard — OnePlace",
  description: "Manage your business conversations and inbox.",
};

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const businesses = await getMyBusinesses();

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "platform_admin")
    .maybeSingle();
  const isAdmin = !!adminRole;

  const service = createServiceClient();
  const openCounts = new Map<string, number>();
  if (businesses.length > 0) {
    const { data } = await service
      .from("conversations")
      .select("business_id")
      .in(
        "business_id",
        businesses.map((b) => b.id),
      )
      .not("status", "in", '("closed","failed")');

    for (const row of data ?? []) {
      openCounts.set(
        row.business_id,
        (openCounts.get(row.business_id) ?? 0) + 1,
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Business dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Choose a business to see its customer conversations.
      </p>

      {isAdmin && (
        <Button render={<Link href="/admin" />} variant="ghost" size="sm" className="mt-3 -ml-2">
          <Shield className="mr-1.5 size-4" aria-hidden />
          Admin Panel
        </Button>
      )}

      {businesses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Store className="mx-auto size-8 text-primary" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">No businesses yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Add your business to start receiving customer conversations.
          </p>
          <Button
            className="mt-6"
            render={<Link href="/onboarding/business" />}
          >
            List your business
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {businesses.map((business) => (
            <li key={business.id}>
              <Link
                href={`/dashboard/${business.id}`}
                className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-semibold">{business.name}</h2>
                  <span className="shrink-0 text-xs font-medium capitalize text-muted-foreground">
                    {business.role}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="size-3.5" aria-hidden />
                  {openCounts.get(business.id) ?? 0} open conversations
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
