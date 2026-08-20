import { createServiceClient } from "@/lib/supabase/service";
import type { BusinessSummary } from "@/lib/discovery";

/**
 * Returns businesses similar to the given one, based on shared categories
 * and services. Used on business profile pages ("Similar businesses").
 */
export async function getSimilarBusinesses(
  businessId: string,
  maxResults = 6,
): Promise<BusinessSummary[]> {
  const service = createServiceClient();

  // 1. Get the business's categories
  const { data: links } = await service
    .from("business_categories")
    .select("category_id")
    .eq("business_id", businessId);

  if (!links || links.length === 0) return [];

  const categoryIds = links.map((l) => l.category_id);

  // 2. Find other businesses in the same categories
  const { data: similarLinks } = await service
    .from("business_categories")
    .select("business_id, category_id")
    .in("category_id", categoryIds)
    .neq("business_id", businessId);

  if (!similarLinks || similarLinks.length === 0) return [];

  // Count shared categories per business
  const scoreMap = new Map<string, number>();
  for (const link of similarLinks) {
    scoreMap.set(link.business_id, (scoreMap.get(link.business_id) ?? 0) + 1);
  }

  // Sort by most shared categories, take top N
  const sorted = Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxResults)
    .map(([id]) => id);

  if (sorted.length === 0) return [];

  // 3. Fetch business summaries
  const { data: businesses } = await service
    .from("businesses")
    .select("id, name, slug, description, city, province, verification_status, logo_url, cover_image_url")
    .in("id", sorted)
    .eq("status", "active");

  if (!businesses) return [];

  // 4. Get ratings and service counts
  const bizIds = businesses.map((b) => b.id);

  const [ratingsResult, servicesResult, categoriesResult] = await Promise.all([
    service
      .from("reviews")
      .select("business_id, rating")
      .in("business_id", bizIds)
      .eq("status", "published"),
    service
      .from("business_services")
      .select("business_id, price, min_price")
      .in("business_id", bizIds)
      .eq("is_active", true),
    service
      .from("business_categories")
      .select("business_id, category_id, is_primary")
      .in("business_id", bizIds),
  ]);

  // Build lookup maps
  const ratingMap = new Map<string, { sum: number; count: number }>();
  for (const r of ratingsResult.data ?? []) {
    const existing = ratingMap.get(r.business_id) ?? { sum: 0, count: 0 };
    existing.sum += r.rating ?? 0;
    existing.count++;
    ratingMap.set(r.business_id, existing);
  }

  const servicesCountMap = new Map<string, number>();
  const priceMap = new Map<string, number>();
  for (const s of servicesResult.data ?? []) {
    servicesCountMap.set(s.business_id, (servicesCountMap.get(s.business_id) ?? 0) + 1);
    const price = s.min_price ?? s.price;
    if (price != null) {
      const current = priceMap.get(s.business_id);
      if (current == null || price < current) {
        priceMap.set(s.business_id, price);
      }
    }
  }

  // Get primary category names
  const catIds = [...new Set((categoriesResult.data ?? []).map((c) => c.category_id))];
  let catNameMap = new Map<string, string>();
  if (catIds.length > 0) {
    const { data: cats } = await service
      .from("categories")
      .select("id, name")
      .in("id", catIds);
    catNameMap = new Map((cats ?? []).map((c) => [c.id, c.name]));
  }

  const primaryCatMap = new Map<string, string | null>();
  for (const c of categoriesResult.data ?? []) {
    if (c.is_primary) {
      primaryCatMap.set(c.business_id, catNameMap.get(c.category_id) ?? null);
    }
  }
  // Fill in missing primary categories
  for (const biz of businesses) {
    if (!primaryCatMap.has(biz.id)) {
      const firstCat = categoriesResult.data?.find((c) => c.business_id === biz.id);
      primaryCatMap.set(biz.id, firstCat ? catNameMap.get(firstCat.category_id) ?? null : null);
    }
  }

  // Preserve ranked order
  const bizMap = new Map(businesses.map((b) => [b.id, b]));

  return sorted.map((id) => {
    const biz = bizMap.get(id);
    if (!biz) return null;

    const rating = ratingMap.get(id);
    const avgRating = rating && rating.count > 0
      ? Math.round((rating.sum / rating.count) * 10) / 10
      : null;

    return {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      description: biz.description,
      primaryCategoryName: primaryCatMap.get(biz.id) ?? null,
      primaryCategorySlug: null,
      city: biz.city,
      province: biz.province,
      rating: avgRating,
      reviewCount: rating?.count ?? 0,
      priceFrom: priceMap.get(id) ?? null,
      servicesCount: servicesCountMap.get(id) ?? 0,
      logoUrl: biz.logo_url ?? null,
      coverImageUrl: biz.cover_image_url ?? null,
    };
  }).filter(Boolean) as BusinessSummary[];
}
