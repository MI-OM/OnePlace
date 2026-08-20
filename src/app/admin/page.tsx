import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Building2,
  ClipboardCheck,
  History,
  MessageSquare,
  Shield,
  Star,
  Tag,
  Users,
} from "lucide-react";

import { getUser } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin – OnePlace" };

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");

  let stats;
  try {
    stats = await getAdminStats();
  } catch {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Shield className="size-8" aria-hidden />
        <p>You don&apos;t have admin access.</p>
        <Button render={<Link href="/" />}>Back to Home</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Total Businesses"
          value={stats.totalBusinesses}
          sub={`${stats.activeBusinesses} active`}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Pending Verifications"
          value={stats.pendingVerifications}
          highlight={stats.pendingVerifications > 0}
        />
        <StatCard
          icon={Star}
          label="Total Reviews"
          value={stats.totalReviews}
          sub={`${stats.reportedReviews} reported`}
          highlight={stats.reportedReviews > 0}
        />
        <StatCard
          icon={MessageSquare}
          label="Conversations"
          value={stats.totalConversations}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button render={<Link href="/admin/businesses" />} variant="outline">
          Manage Businesses
        </Button>
        <Button render={<Link href="/admin/reviews" />} variant="outline">
          Reported Reviews
          {stats.reportedReviews > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {stats.reportedReviews}
              </span>
            )}
        </Button>
        <Button render={<Link href="/admin/categories" />} variant="outline">
          <Tag className="mr-1 size-4" />
          Categories
        </Button>
        <Button render={<Link href="/admin/users" />} variant="outline">
          <Users className="mr-1 size-4" />
          Users
        </Button>
        <Button render={<Link href="/admin/audit" />} variant="outline">
          <History className="mr-1 size-4" />
          Audit Log
        </Button>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 ${
        highlight ? "border-primary/50" : "border-border"
      }`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
