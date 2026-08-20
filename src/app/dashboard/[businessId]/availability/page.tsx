import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getUser } from "@/lib/auth";
import { getExceptions } from "@/lib/business/availability-actions";
import { AvailabilityPageClient } from "@/components/business/availability-page-client";

export const metadata: Metadata = { title: "Availability — Dashboard" };

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await getUser();
  if (!user) notFound();

  const { businessId } = await params;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const exceptions = await getExceptions(businessId, year, month);

  return (
    <AvailabilityPageClient
      businessId={businessId}
      initialExceptions={exceptions}
      initialYear={year}
      initialMonth={month - 1}
    />
  );
}
