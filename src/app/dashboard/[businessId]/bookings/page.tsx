import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getBusinessBookings } from "@/lib/business/booking-actions";
import { BookingsManager } from "@/components/business/bookings-manager";
import { BusinessExportBar } from "@/components/business/business-export-bar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Bookings" };

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getUser();
  if (!user) notFound();

  const { businessId } = await params;
  const { date } = await searchParams;
  const service = createServiceClient();

  const { data: business } = await service
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) notFound();

  const bookings = await getBusinessBookings(businessId, date);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <Button render={<Link href={`/dashboard/${businessId}`} />} variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Back to inbox
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {business.name} · Manage appointments and reservations.
      </p>

      <div className="mt-4">
        <BusinessExportBar businessId={businessId} />
      </div>

      <BookingsManager businessId={businessId} initialBookings={bookings} />
    </main>
  );
}
