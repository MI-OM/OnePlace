import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireDashboardAccess, BUSINESS_ADMIN_ROLES } from "@/lib/dashboard-access";
import { createServiceClient } from "@/lib/supabase/service";
import { syncStripeAccount } from "@/lib/payments/core";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { getBusinessPaymentsOverview } from "@/lib/payments/queries";
import { PaymentsManager } from "@/components/business/payments-manager";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ stripe?: string }>;
}) {
  const { businessId } = await params;
  const { role } = await requireDashboardAccess(businessId, BUSINESS_ADMIN_ROLES);
  const { stripe } = await searchParams;

  const service = createServiceClient();
  const { data: business } = await service
    .from("businesses")
    .select("id, name, stripe_account_id, stripe_charges_enabled")
    .eq("id", businessId)
    .maybeSingle();
  if (!business) notFound();

  // Back from Stripe onboarding (or not yet live): pull the latest state so
  // the page doesn't depend on the account.updated webhook arriving first.
  if (
    business.stripe_account_id &&
    isStripeConfigured() &&
    (stripe === "return" || !business.stripe_charges_enabled)
  ) {
    try {
      await syncStripeAccount(business.stripe_account_id);
    } catch {
      // Stripe unreachable: show the last known state.
    }
  }

  const overview = await getBusinessPaymentsOverview(businessId);
  if (!overview) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <Button
        render={<Link href={`/dashboard/${businessId}`} />}
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Back to inbox
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
      <p className="mt-1 text-sm text-muted-foreground">{business.name}</p>

      <PaymentsManager businessId={businessId} isOwner={role === "owner"} overview={overview} />
    </main>
  );
}
