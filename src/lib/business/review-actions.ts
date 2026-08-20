"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

const submitReviewSchema = z.object({
  businessId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().max(2000).optional(),
});

export async function submitReview(
  data: z.infer<typeof submitReviewSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please sign in to leave a review." };

    const parsed = submitReviewSchema.parse(data);
    const service = createServiceClient();

    const { data: existing } = await service
      .from("reviews")
      .select("id")
      .eq("business_id", parsed.businessId)
      .eq("reviewer_id", user.id)
      .maybeSingle();

    if (existing) {
      return { ok: false, error: "You have already reviewed this business." };
    }

    const { error } = await service.from("reviews").insert({
      business_id: parsed.businessId,
      reviewer_id: user.id,
      rating: parsed.rating,
      title: parsed.title || null,
      body: parsed.body || null,
      status: "published",
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/businesses/${parsed.businessId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const reportReviewSchema = z.object({
  reviewId: z.string(),
  businessId: z.string(),
  reason: z.string().min(1, "Please provide a reason").max(500),
});

export async function reportReview(
  data: z.infer<typeof reportReviewSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please sign in." };

    const parsed = reportReviewSchema.parse(data);

    const { data: member } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", parsed.businessId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!member) return { ok: false, error: "Only business members can report reviews." };

    const service = createServiceClient();

    const { error } = await service
      .from("reviews")
      .update({
        status: "hidden",
        reported_at: new Date().toISOString(),
        reported_by: user.id,
        report_reason: parsed.reason,
      })
      .eq("id", parsed.reviewId)
      .eq("business_id", parsed.businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/businesses/${parsed.businessId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
