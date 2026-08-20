"use server";

import { z } from "zod";

import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

const businessOnboardingSchema = z.object({
  step1: z.object({
    businessName: z.string().min(2, "Business name required"),
    businessDescription: z.string().optional(),
    businessAddress: z.string().optional(),
    businessCity: z.string().min(2, "City required"),
    businessProvince: z.string().min(2, "Province required"),
    businessPostalCode: z.string().optional(),
  }),
  step2: z.object({
    categoryIds: z.array(z.string()).min(1, "Select at least 1 category"),
    services: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
      }),
    ),
  }),
  step3: z.object({
    hours: z.array(z.object({
      day: z.enum(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
      isClosed: z.boolean(),
      opensAt: z.string().optional(),
      closesAt: z.string().optional(),
    })),
  }),
  step4: z.object({
    tone: z.enum(["friendly", "professional", "casual"]),
    welcomeMessage: z.string().optional(),
    fallbackMessage: z.string().optional(),
    humanEscalationEnabled: z.boolean().optional(),
    voiceEnabled: z.boolean().optional(),
  }),
});

export type BusinessOnboardingResult =
  | { success: true; redirectUrl: string }
  | { success: false; error: string };

const DAY_OF_WEEK: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueBusinessSlug(base: string): Promise<string> {
  const service = createServiceClient();
  const candidate = slugify(base) || "business";

  for (let i = 1; ; i++) {
    const slug = i === 1 ? candidate : `${candidate}-${i}`;
    const { data } = await service
      .from("businesses")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
  }
}

export async function createBusinessOnboarding(
  data: z.infer<typeof businessOnboardingSchema>,
): Promise<BusinessOnboardingResult> {
  const parsed = businessOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please review your details.",
    };
  }

  const user = await getUser();
  if (!user) {
    return { success: false, error: "Please sign in to continue." };
  }

  const { step1, step2, step3, step4 } = parsed.data;

  const service = createServiceClient();

  // Resolve a unique slug before the first write so a collision can't leave a
  // partially-created business behind.
  const slug = await uniqueBusinessSlug(step1.businessName);

  let businessId: string | null = null;

  try {
    const { data: business, error: businessError } = await service
      .from("businesses")
      .insert({
        name: step1.businessName,
        slug,
        description: step1.businessDescription ?? null,
        address_line_1: step1.businessAddress ?? null,
        city: step1.businessCity,
        province: step1.businessProvince,
        postal_code: step1.businessPostalCode ?? null,
        country: "CA",
        status: "active",
        verification_status: "unverified",
      })
      .select("id")
      .single();

    if (businessError || !business) {
      throw new Error(businessError?.message ?? "Could not create your business.");
    }
    businessId = business.id;

    const { error: categoryError } = await service
      .from("business_categories")
      .insert(
        step2.categoryIds.map((categoryId) => ({
          business_id: businessId,
          category_id: categoryId,
          is_primary: categoryId === step2.categoryIds[0],
        })),
      );
    if (categoryError) {
      throw new Error(categoryError.message);
    }

    if (step2.services.length > 0) {
      const { error: servicesError } = await service
        .from("business_services")
        .insert(
          step2.services.map((service) => ({
            business_id: businessId,
            service_id: service.id,
            name: service.name,
            description: service.description ?? null,
            price_type: "quote_required",
            is_active: true,
          })),
        );
      if (servicesError) {
        throw new Error(servicesError.message);
      }
    }

    const seenDays = new Set<number>();
    const hours = step3.hours.filter((h) => {
      const day = DAY_OF_WEEK[h.day];
      if (seenDays.has(day)) return false;
      seenDays.add(day);
      return true;
    });
    if (hours.length > 0) {
      const { error: hoursError } = await service.from("business_hours").insert(
        hours.map((h) => ({
          business_id: businessId,
          day_of_week: DAY_OF_WEEK[h.day],
          is_closed: h.isClosed,
          opens_at: h.isClosed ? null : h.opensAt || null,
          closes_at: h.isClosed ? null : h.closesAt || null,
        })),
      );
      if (hoursError) {
        throw new Error(hoursError.message);
      }
    }

    const { error: aiError } = await service.from("ai_configurations").insert({
      business_id: businessId,
      enabled: true,
      greeting: step4.welcomeMessage ?? null,
      personality: step4.tone,
      escalation_enabled: step4.humanEscalationEnabled ?? true,
      escalation_message: step4.fallbackMessage ?? null,
      handoff_enabled: true,
      voice_enabled: step4.voiceEnabled ?? false,
      language: "en",
    });
    if (aiError) {
      throw new Error(aiError.message);
    }

    const { error: memberError } = await service.from("business_members").insert({
      business_id: businessId,
      user_id: user.id,
      role: "owner",
      status: "active",
    });
    if (memberError) {
      throw new Error(memberError.message);
    }

    const { error: roleError } = await service
      .from("user_roles")
      .upsert(
        { user_id: user.id, role: "business_owner" },
        { onConflict: "user_id, role", ignoreDuplicates: true },
      );
    if (roleError) {
      throw new Error(roleError.message);
    }

    return { success: true, redirectUrl: "/account" };
  } catch (error) {
    // Roll back the partially-created business; related rows cascade.
    if (businessId) {
      await service.from("businesses").delete().eq("id", businessId);
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not create your business.",
    };
  }
}
