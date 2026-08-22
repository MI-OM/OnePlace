"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { embedBusiness } from "@/lib/search/embeddings";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Business name required"),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  websiteUrl: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  foundedYear: z.number().int().min(1900).max(2100).nullable().optional(),
});

const updateAIConfigSchema = z.object({
  greeting: z.string().optional(),
  personality: z.string().optional(),
  handoffEnabled: z.boolean(),
  escalationEnabled: z.boolean(),
  voiceEnabled: z.boolean(),
});

const updateHoursSchema = z.object({
  hours: z.array(
    z.object({
      day: z.number(),
      isClosed: z.boolean(),
      opensAt: z.string().optional(),
      closesAt: z.string().optional(),
    }),
  ),
});

const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Service name required"),
  description: z.string().optional(),
  price: z.number().optional(),
  priceType: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  durationMinutes: z.number().optional(),
});

const updateServicesSchema = z.object({
  services: z.array(serviceSchema),
  deletedIds: z.array(z.string()),
});

async function requireBusinessMember(businessId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");

  const { data: member } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member) throw new Error("You don't have access to this business.");
  return user.id;
}

export async function updateBusinessProfile(
  businessId: string,
  data: z.infer<typeof updateProfileSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const parsed = updateProfileSchema.parse(data);
    const service = createServiceClient();

    const { error } = await service
      .from("businesses")
      .update({
        name: parsed.name,
        description: parsed.description || null,
        phone: parsed.phone || null,
        email: parsed.email || null,
        website_url: parsed.websiteUrl || null,
        address_line_1: parsed.addressLine1 || null,
        city: parsed.city || null,
        province: parsed.province || null,
        postal_code: parsed.postalCode || null,
        founded_year: parsed.foundedYear ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    if (error) return { ok: false, error: error.message };

    // Re-embed in background (non-blocking) so search index stays fresh
    embedBusiness(businessId).catch(() => {});

    revalidatePath(`/dashboard/${businessId}`);
    revalidatePath(`/dashboard/${businessId}/settings`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateBusinessAIConfig(
  businessId: string,
  data: z.infer<typeof updateAIConfigSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const parsed = updateAIConfigSchema.parse(data);
    const service = createServiceClient();

    const { error } = await service
      .from("ai_configurations")
      .update({
        greeting: parsed.greeting || null,
        personality: parsed.personality || null,
        handoff_enabled: parsed.handoffEnabled,
        escalation_enabled: parsed.escalationEnabled,
        voice_enabled: parsed.voiceEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}/settings`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateBusinessHours(
  businessId: string,
  data: z.infer<typeof updateHoursSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const parsed = updateHoursSchema.parse(data);
    const service = createServiceClient();

    for (const entry of parsed.hours) {
      const { error } = await service
        .from("business_hours")
        .upsert(
          {
            business_id: businessId,
            day_of_week: entry.day,
            is_closed: entry.isClosed,
            opens_at: entry.isClosed ? null : entry.opensAt || null,
            closes_at: entry.isClosed ? null : entry.closesAt || null,
          },
          { onConflict: "business_id,day_of_week" },
        );

      if (error) return { ok: false, error: error.message };
    }

    revalidatePath(`/dashboard/${businessId}/settings`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateBusinessServices(
  businessId: string,
  data: z.infer<typeof updateServicesSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const parsed = updateServicesSchema.parse(data);
    const service = createServiceClient();

    if (parsed.deletedIds.length > 0) {
      const { error } = await service
        .from("business_services")
        .delete()
        .in("id", parsed.deletedIds)
        .eq("business_id", businessId);

      if (error) return { ok: false, error: error.message };
    }

    for (const svc of parsed.services) {
      const serviceData = {
        name: svc.name,
        description: svc.description || null,
        price: svc.price ?? null,
        price_type: svc.priceType || "fixed",
        min_price: svc.minPrice ?? null,
        max_price: svc.maxPrice ?? null,
        duration_minutes: svc.durationMinutes ?? null,
      };

      if (svc.id) {
        const { error } = await service
          .from("business_services")
          .update(serviceData)
          .eq("id", svc.id)
          .eq("business_id", businessId);

        if (error) return { ok: false, error: error.message };
      } else {
        const { error } = await service.from("business_services").insert({
          ...serviceData,
          business_id: businessId,
          is_active: true,
        });

        if (error) return { ok: false, error: error.message };
      }
    }

    revalidatePath(`/dashboard/${businessId}/settings`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const updateImagesSchema = z.object({
  logoUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  photos: z.array(
    z.object({
      url: z.string(),
      altText: z.string(),
      sortOrder: z.number(),
    }),
  ),
});

export async function updateBusinessImages(
  businessId: string,
  data: z.infer<typeof updateImagesSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const parsed = updateImagesSchema.parse(data);
    const service = createServiceClient();

    const { error: bizErr } = await service
      .from("businesses")
      .update({
        logo_url: parsed.logoUrl,
        cover_image_url: parsed.coverImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    if (bizErr) return { ok: false, error: bizErr.message };

    const { error: delErr } = await service
      .from("business_photos")
      .delete()
      .eq("business_id", businessId);

    if (delErr) return { ok: false, error: delErr.message };

    if (parsed.photos.length > 0) {
      const { error: insErr } = await service.from("business_photos").insert(
        parsed.photos.map((p) => ({
          business_id: businessId,
          url: p.url,
          alt_text: p.altText || null,
          sort_order: p.sortOrder,
        })),
      );

      if (insErr) return { ok: false, error: insErr.message };
    }

    revalidatePath(`/dashboard/${businessId}/settings`);
    revalidatePath(`/businesses/${businessId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const updateWebsiteSchema = z.object({
  template: z.enum(["classic", "modern", "minimal"]),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
});

export async function updateBusinessWebsite(
  businessId: string,
  data: z.infer<typeof updateWebsiteSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const parsed = updateWebsiteSchema.parse(data);
    const service = createServiceClient();

    const { error } = await service
      .from("businesses")
      .update({
        website_template: parsed.template,
        website_primary_color: parsed.primaryColor,
        website_accent_color: parsed.accentColor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}/settings`);
    revalidatePath(`/site/${businessId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const updateProductsSchema = z.object({
  products: z.array(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1, "Product name required"),
      description: z.string().optional(),
      price: z.number().optional(),
      priceType: z.enum(["fixed", "starting_from", "range", "quote_required"]).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      currency: z.string().default("CAD"),
      imageUrl: z.string().optional(),
      url: z.string().optional().refine(
        (v) => !v || /^https?:\/\/.+/.test(v),
        "URL must start with http:// or https://"
      ),
      productType: z.enum(["product", "digital", "gift_card", "service_addon"]).default("product"),
      sortOrder: z.number().int().default(0),
      isActive: z.boolean().default(true),
    })
  ),
  deletedIds: z.array(z.string().uuid()).default([]),
});

export async function updateBusinessProducts(
  businessId: string,
  data: z.infer<typeof updateProductsSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const parsed = updateProductsSchema.parse(data);
    const service = createServiceClient();

    const { error } = await service
      .from("business_products")
      .delete()
      .in("id", parsed.deletedIds);

    if (error) return { ok: false, error: error.message };

    if (parsed.products.length > 0) {
      // Separate products with existing IDs (upsert) from new products (insert)
      const productsWithId = parsed.products.filter((p) => p.id !== undefined && p.id !== null);
      const productsNew = parsed.products.filter((p) => p.id === undefined || p.id === null);

      // Upsert products that already have IDs
      if (productsWithId.length > 0) {
        const { error: upsertError } = await service
          .from("business_products")
          .upsert(
            productsWithId.map((p) => ({
              id: p.id,
              business_id: businessId,
              name: p.name,
              description: p.description,
              price: p.price,
              price_type: p.priceType,
              min_price: p.minPrice,
              max_price: p.maxPrice,
              currency: p.currency,
              image_url: p.imageUrl,
              url: p.url,
              product_type: p.productType,
              sort_order: p.sortOrder,
              is_active: p.isActive,
            })),
            { onConflict: "id" }
          );
        if (upsertError) return { ok: false, error: upsertError.message };
      }

      // Insert new products (let DB generate UUID via DEFAULT gen_random_uuid)
      if (productsNew.length > 0) {
        const { error: insertError } = await service
          .from("business_products")
          .insert(
            productsNew.map((p) => ({
              business_id: businessId,
              name: p.name,
              description: p.description,
              price: p.price,
              price_type: p.priceType,
              min_price: p.minPrice,
              max_price: p.maxPrice,
              currency: p.currency,
              image_url: p.imageUrl,
              url: p.url,
              product_type: p.productType,
              sort_order: p.sortOrder,
              is_active: p.isActive,
            }))
          );
        if (insertError) return { ok: false, error: insertError.message };
      }
    }

    // Re-embed in background (products feed into the search embedding)
    embedBusiness(businessId).catch(() => {});

    revalidatePath(`/dashboard/${businessId}/settings`);
    revalidatePath(`/site/${businessId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
