import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { BusinessSettingsForm } from "@/components/business/business-settings-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Business Settings" };

export default async function BusinessSettingsPage({
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
    .select("id, name, slug, description, founded_year, phone, email, website_url, address_line_1, city, province, postal_code, logo_url, cover_image_url, website_template, website_primary_color, website_accent_color")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) notFound();

  const { data: hours } = await service
    .from("business_hours")
    .select("day_of_week, is_closed, opens_at, closes_at")
    .eq("business_id", businessId)
    .order("day_of_week");

  const { data: services } = await service
    .from("business_services")
    .select("id, name, description, price, price_type, min_price, max_price, duration_minutes")
    .eq("business_id", businessId)
    .order("created_at");

  const { data: aiConfig } = await service
    .from("ai_configurations")
    .select("greeting, personality, handoff_enabled, escalation_enabled, voice_enabled")
    .eq("business_id", businessId)
    .maybeSingle();

  const { data: photos } = await service
    .from("business_photos")
    .select("id, url, alt_text, sort_order")
    .eq("business_id", businessId)
    .order("sort_order");

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <Button render={<Link href={`/dashboard/${businessId}`} />} variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Back to inbox
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Business Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">{business.name}</p>

      <BusinessSettingsForm
        businessId={businessId}
        business={{
          name: business.name,
          description: business.description,
          phone: business.phone,
          email: business.email,
          websiteUrl: business.website_url,
          addressLine1: business.address_line_1,
          city: business.city,
          province: business.province,
          postalCode: business.postal_code,
          logoUrl: business.logo_url,
          coverImageUrl: business.cover_image_url,
          slug: business.slug ?? businessId,
          websiteTemplate: business.website_template ?? "classic",
          websitePrimaryColor: business.website_primary_color ?? "#123c3a",
          websiteAccentColor: business.website_accent_color ?? "#e7a83b",
          foundedYear: business.founded_year ?? null,
        }}
        hours={(hours ?? []).map((h) => ({
          day: h.day_of_week,
          isClosed: h.is_closed,
          opensAt: h.opens_at,
          closesAt: h.closes_at,
        }))}
        services={(services ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price,
          priceType: s.price_type,
          minPrice: s.min_price,
          maxPrice: s.max_price,
          durationMinutes: s.duration_minutes,
        }))}
        aiConfig={aiConfig ? {
          greeting: aiConfig.greeting,
          personality: aiConfig.personality,
          handoffEnabled: aiConfig.handoff_enabled,
          escalationEnabled: aiConfig.escalation_enabled,
          voiceEnabled: aiConfig.voice_enabled,
        } : null}
        photos={(photos ?? []).map((p) => ({
          id: p.id,
          url: p.url,
          altText: p.alt_text,
          sortOrder: p.sort_order,
        }))}
      />
    </main>
  );
}
