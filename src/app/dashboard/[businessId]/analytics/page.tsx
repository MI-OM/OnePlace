import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getBusinessAnalytics } from "@/lib/business/analytics";
import { AnalyticsDashboard } from "@/components/business/analytics-dashboard";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await getUser();
  if (!user) notFound();

  const { businessId } = await params;
  const service = createServiceClient();

  const { data: business } = await service
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) notFound();

  const analytics = await getBusinessAnalytics(businessId);
  if (!analytics) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <Button render={<Link href={`/dashboard/${businessId}`} />} variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Back to inbox
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {business.name} · Performance overview for the last 30 days.
      </p>

      <AnalyticsDashboard analytics={analytics} />
    </main>
  );
}
