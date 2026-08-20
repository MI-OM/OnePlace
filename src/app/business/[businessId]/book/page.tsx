import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createServiceClient } from "@/lib/supabase/service";
import { BookingForm } from "@/components/business/booking-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Book Appointment" };

export default async function BookPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const service = createServiceClient();

  const { data: business } = await service
    .from("businesses")
    .select("id, name, address_line_1, city, province")
    .eq("id", businessId)
    .eq("verification_status", "verified")
    .maybeSingle();

  if (!business) notFound();

  const { data: services } = await service
    .from("business_services")
    .select("id, name, description, duration_minutes, price, price_type")
    .eq("business_id", businessId)
    .eq("booking_required", true)
    .eq("is_active", true)
    .order("name");

  const { data: allServices } = await service
    .from("business_services")
    .select("id, name, description, duration_minutes, price, price_type, booking_required")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name");

  const bookingServices = services?.length ? services : allServices ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <Button render={<Link href={`/business/${businessId}`} />} variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Back to {business.name}
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Book an Appointment</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {business.name}
        {business.city ? ` · ${business.city}` : ""}
      </p>

      <BookingForm
        businessId={businessId}
        services={bookingServices.map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.duration_minutes ?? 30,
          price: s.price,
          priceType: s.price_type,
        }))}
      />
    </main>
  );
}
