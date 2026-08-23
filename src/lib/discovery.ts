import { classifyIntent, interpretQuery, expandSynonyms, interpretQueryTerms } from "@/lib/search/interpret";
import { embedQuery } from "@/lib/search/embeddings";
import { rewriteSearchQuery } from "@/lib/search/llm-rewrite";
import { createAnonClient } from "@/lib/supabase/anon";

export type BusinessSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  primaryCategoryName: string | null;
  primaryCategorySlug: string | null;
  city: string | null;
  province: string | null;
  rating: number | null;
  reviewCount: number;
  priceFrom: number | null;
  servicesCount: number;
  distanceMeters?: number | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  isSponsored?: boolean;
  relevance?: number | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  description: string | null;
  parentId: string | null;
  parentName: string | null;
  parentSlug: string | null;
  businessCount: number;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  primary_category_name: string | null;
  primary_category_slug: string | null;
  city: string | null;
  province: string | null;
  rating: number | null;
  review_count: number;
  price_from: number | null;
  services_count: number;
  logo_url: string | null;
  cover_image_url: string | null;
  is_sponsored: boolean | null;
  relevance: number | null;
};

const RPC = "list_businesses";
const HYBRID_RPC = "hybrid_search";

function toSummary(row: BusinessRow): BusinessSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    primaryCategoryName: row.primary_category_name,
    primaryCategorySlug: row.primary_category_slug,
    city: row.city,
    province: row.province,
    rating: row.rating,
    reviewCount: row.review_count,
    priceFrom: row.price_from,
    servicesCount: row.services_count,
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    isSponsored: row.is_sponsored ?? false,
    relevance: row.relevance,
  };
}



/**
 * Search businesses using hybrid FTS + vector search.
 *
 * Flow: interpret query locally + rewrite via LLM in parallel,
 * merge enriched terms for FTS, embed original query for vector search,
 * honor categoryHint to narrow results, single hybrid_search RPC.
 */
export async function searchBusinesses(
  query: string,
  maxResults = 30,
): Promise<BusinessSummary[]> {
  const supabase = createAnonClient();

  // ── 1. Build enriched search terms for FTS ─────────────────────────────
  const contentTerms = interpretQueryTerms(query, 6);
  const intent = classifyIntent(query);
  const localTerms = [...new Set([
    ...contentTerms,
    ...expandSynonyms(contentTerms),
    ...intent.terms,
  ])];

  const llmTerms = await rewriteSearchQuery(query);
  const llmTokens = llmTerms
    ? llmTerms.split(/\s+/).filter((t) => t.length >= 2)
    : [];

  const allTerms = [...new Set([...localTerms, ...llmTokens])];
  const enrichedQuery = allTerms.length > 0 ? allTerms.join(" ") : query.trim();

  // ── 2. Embed the ORIGINAL query (not enriched) for semantic quality ────
  // The original sentence has richer semantic meaning than keyword soup.
  const queryEmbedding = await embedQuery(query.trim());

  // ── 3. Resolve categoryHint → category_id ──────────────────────────────
  let categoryId: string | undefined;
  if (intent.categoryHint) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", `%${intent.categoryHint}%`)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    categoryId = cat?.id;
  }

  // ── 4. Single hybrid search call ───────────────────────────────────────
  const { data: results, error } = await supabase.rpc(HYBRID_RPC, {
    query_text: enrichedQuery || undefined,
    query_embedding: queryEmbedding ? JSON.stringify(queryEmbedding) : null,
    match_count: maxResults,
    category_id: categoryId ?? null,
  });

  if (error) {
    console.error("[search] hybrid_search error:", error.message, {
      query,
      enrichedQuery,
      categoryId,
    });
    return [];
  }

  return (results ?? []).map(toSummary);
}

export async function listBusinessesInCategory(
  categoryId: string,
  maxResults = 50,
): Promise<BusinessSummary[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc(RPC, {
    category_id: categoryId,
    max_results: maxResults,
  });

  if (error) {
    throw new Error(`Couldn't load businesses: ${error.message}`);
  }

  return (data ?? []).map(toSummary);
}

export async function listFeaturedBusinesses(
  maxResults = 8,
): Promise<BusinessSummary[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, slug, description, city, province, logo_url, cover_image_url, is_sponsored")
    .eq("status", "active")
    .is("deleted_at", null)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(maxResults);

  if (error) {
    throw new Error(`Couldn't load featured businesses: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  const ids = data.map((b) => b.id);

  const [catLinks, reviews, services] = await Promise.all([
    supabase
      .from("business_categories")
      .select("business_id, is_primary, category:categories(name, slug)")
      .in("business_id", ids)
      .order("is_primary", { ascending: false }),
    supabase
      .from("reviews")
      .select("business_id, rating")
      .in("business_id", ids)
      .eq("status", "published"),
    supabase
      .from("business_services")
      .select("business_id, price")
      .in("business_id", ids)
      .eq("is_active", true),
  ]);

  const primaryCatMap = new Map<string, { name: string; slug: string }>();
  for (const link of catLinks.data ?? []) {
    if (link.is_primary && !primaryCatMap.has(link.business_id)) {
      const cat = Array.isArray(link.category) ? link.category[0] : link.category;
      if (cat) primaryCatMap.set(link.business_id, { name: cat.name, slug: cat.slug });
    }
  }
  if (primaryCatMap.size === 0) {
    for (const link of catLinks.data ?? []) {
      if (!primaryCatMap.has(link.business_id)) {
        const cat = Array.isArray(link.category) ? link.category[0] : link.category;
        if (cat) primaryCatMap.set(link.business_id, { name: cat.name, slug: cat.slug });
      }
    }
  }

  const ratingMap = new Map<string, { total: number; count: number }>();
  for (const r of reviews.data ?? []) {
    const entry = ratingMap.get(r.business_id) ?? { total: 0, count: 0 };
    entry.total += r.rating;
    entry.count += 1;
    ratingMap.set(r.business_id, entry);
  }

  const priceMap = new Map<string, number>();
  for (const s of services.data ?? []) {
    if (s.price != null) {
      const cur = priceMap.get(s.business_id);
      if (cur == null || s.price < cur) priceMap.set(s.business_id, s.price);
    }
  }

  const servicesCountMap = new Map<string, number>();
  for (const s of services.data ?? []) {
    servicesCountMap.set(s.business_id, (servicesCountMap.get(s.business_id) ?? 0) + 1);
  }

  return data.map((b) => {
    const entry = ratingMap.get(b.id);
    const avg = entry ? Math.round((entry.total / entry.count) * 10) / 10 : null;
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      primaryCategoryName: primaryCatMap.get(b.id)?.name ?? null,
      primaryCategorySlug: primaryCatMap.get(b.id)?.slug ?? null,
      city: b.city,
      province: b.province,
      rating: avg,
      reviewCount: entry?.count ?? 0,
      priceFrom: priceMap.get(b.id) ?? null,
      servicesCount: servicesCountMap.get(b.id) ?? 0,
      logoUrl: b.logo_url,
      coverImageUrl: b.cover_image_url,
      isSponsored: b.is_sponsored,
    };
  });
}

export async function listSponsoredBusinesses(
  maxResults = 8,
): Promise<BusinessSummary[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, slug, description, city, province, logo_url, cover_image_url, is_sponsored")
    .eq("status", "active")
    .is("deleted_at", null)
    .eq("is_sponsored", true)
    .order("sponsored_at", { ascending: false })
    .limit(maxResults);

  if (error) {
    throw new Error(`Couldn't load sponsored businesses: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  const ids = data.map((b) => b.id);

  const [catLinks, reviews, services] = await Promise.all([
    supabase
      .from("business_categories")
      .select("business_id, is_primary, category:categories(name, slug)")
      .in("business_id", ids)
      .order("is_primary", { ascending: false }),
    supabase
      .from("reviews")
      .select("business_id, rating")
      .in("business_id", ids)
      .eq("status", "published"),
    supabase
      .from("business_services")
      .select("business_id, price")
      .in("business_id", ids)
      .eq("is_active", true),
  ]);

  const primaryCatMap = new Map<string, { name: string; slug: string }>();
  for (const link of catLinks.data ?? []) {
    if (link.is_primary && !primaryCatMap.has(link.business_id)) {
      const cat = Array.isArray(link.category) ? link.category[0] : link.category;
      if (cat) primaryCatMap.set(link.business_id, { name: cat.name, slug: cat.slug });
    }
  }
  if (primaryCatMap.size === 0) {
    for (const link of catLinks.data ?? []) {
      if (!primaryCatMap.has(link.business_id)) {
        const cat = Array.isArray(link.category) ? link.category[0] : link.category;
        if (cat) primaryCatMap.set(link.business_id, { name: cat.name, slug: cat.slug });
      }
    }
  }

  const ratingMap = new Map<string, { total: number; count: number }>();
  for (const r of reviews.data ?? []) {
    const entry = ratingMap.get(r.business_id) ?? { total: 0, count: 0 };
    entry.total += r.rating;
    entry.count += 1;
    ratingMap.set(r.business_id, entry);
  }

  const priceMap = new Map<string, number>();
  for (const s of services.data ?? []) {
    if (s.price != null) {
      const cur = priceMap.get(s.business_id);
      if (cur == null || s.price < cur) priceMap.set(s.business_id, s.price);
    }
  }

  const servicesCountMap = new Map<string, number>();
  for (const s of services.data ?? []) {
    servicesCountMap.set(s.business_id, (servicesCountMap.get(s.business_id) ?? 0) + 1);
  }

  return data.map((b) => {
    const entry = ratingMap.get(b.id);
    const avg = entry ? Math.round((entry.total / entry.count) * 10) / 10 : null;
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      primaryCategoryName: primaryCatMap.get(b.id)?.name ?? null,
      primaryCategorySlug: primaryCatMap.get(b.id)?.slug ?? null,
      city: b.city,
      province: b.province,
      rating: avg,
      reviewCount: entry?.count ?? 0,
      priceFrom: priceMap.get(b.id) ?? null,
      servicesCount: servicesCountMap.get(b.id) ?? 0,
      logoUrl: b.logo_url,
      coverImageUrl: b.cover_image_url,
      isSponsored: b.is_sponsored,
    };
  });
}

export async function getTopRatedBusinesses(
  maxResults = 8,
): Promise<BusinessSummary[]> {
  const supabase = createAnonClient();

  const { data: reviews, error: revErr } = await supabase
    .from("reviews")
    .select("business_id, rating")
    .eq("status", "published");

  if (revErr) throw new Error(`Couldn't load reviews: ${revErr.message}`);

  const agg = new Map<string, { total: number; count: number }>();
  for (const r of reviews ?? []) {
    const entry = agg.get(r.business_id) ?? { total: 0, count: 0 };
    entry.total += r.rating;
    entry.count += 1;
    agg.set(r.business_id, entry);
  }

  const ranked = [...agg.entries()]
    .filter(([, e]) => e.count >= 1)
    .map(([id, e]) => ({
      id,
      avg: Math.round((e.total / e.count) * 10) / 10,
      count: e.count,
    }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, maxResults);

  if (ranked.length === 0) return [];

  const ids = ranked.map((r) => r.id);
  const ratingById = new Map(ranked.map((r) => [r.id, { avg: r.avg, count: r.count }]));

  const [bizData, catLinks, services] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, slug, description, city, province, logo_url, cover_image_url, is_sponsored")
      .in("id", ids)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("business_categories")
      .select("business_id, is_primary, category:categories(name, slug)")
      .in("business_id", ids)
      .order("is_primary", { ascending: false }),
    supabase
      .from("business_services")
      .select("business_id, price")
      .in("business_id", ids)
      .eq("is_active", true),
  ]);

  const bizMap = new Map((bizData.data ?? []).map((b) => [b.id, b]));

  const primaryCatMap = new Map<string, { name: string; slug: string }>();
  for (const link of catLinks.data ?? []) {
    if (link.is_primary && !primaryCatMap.has(link.business_id)) {
      const cat = Array.isArray(link.category) ? link.category[0] : link.category;
      if (cat) primaryCatMap.set(link.business_id, { name: cat.name, slug: cat.slug });
    }
  }

  const priceMap = new Map<string, number>();
  for (const s of services.data ?? []) {
    if (s.price != null) {
      const cur = priceMap.get(s.business_id);
      if (cur == null || s.price < cur) priceMap.set(s.business_id, s.price);
    }
  }

  const servicesCountMap = new Map<string, number>();
  for (const s of services.data ?? []) {
    servicesCountMap.set(s.business_id, (servicesCountMap.get(s.business_id) ?? 0) + 1);
  }

  return ranked
    .map((r) => {
      const b = bizMap.get(r.id);
      if (!b) return null;
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        primaryCategoryName: primaryCatMap.get(b.id)?.name ?? null,
        primaryCategorySlug: primaryCatMap.get(b.id)?.slug ?? null,
        city: b.city,
        province: b.province,
        rating: ratingById.get(b.id)?.avg ?? null,
        reviewCount: ratingById.get(b.id)?.count ?? 0,
        priceFrom: priceMap.get(b.id) ?? null,
        servicesCount: servicesCountMap.get(b.id) ?? 0,
        logoUrl: b.logo_url,
        coverImageUrl: b.cover_image_url,
        isSponsored: b.is_sponsored,
      };
    })
    .filter(Boolean) as BusinessSummary[];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createAnonClient();

  const [categories, counts] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, icon, image_url, description, parent_id")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("business_categories")
      .select("category_id, businesses!inner(status)")
      .eq("businesses.status", "active"),
  ]);

  if (categories.error) {
    throw new Error(`Couldn't load categories: ${categories.error.message}`);
  }
  if (counts.error) {
    throw new Error(`Couldn't load categories: ${counts.error.message}`);
  }

  const byId = new Map(
    (categories.data ?? []).map((category) => [category.id, category]),
  );

  const countsById = new Map<string, number>();
  for (const link of counts.data ?? []) {
    countsById.set(
      link.category_id,
      (countsById.get(link.category_id) ?? 0) + 1,
    );
  }

  return (categories.data ?? []).map((category) => {
    const parent = category.parent_id ? byId.get(category.parent_id) : null;
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      imageUrl: category.image_url ?? null,
      description: category.description,
      parentId: category.parent_id,
      parentName: parent?.name ?? null,
      parentSlug: parent?.slug ?? null,
      businessCount: countsById.get(category.id) ?? 0,
    };
  });
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const categories = await getCategories();
  const category = categories.find((category) => category.slug === slug);
  return category ?? null;
}

// ---------------------------------------------------------------------------
// Location-based distance sorting
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_000;

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Enriches search results with haversine distance when the user provides
 * their location. Fetches lat/lng for all result businesses, attaches
 * `distanceMeters`, and re-sorts nearest-first.
 */
export async function enrichWithDistance(
  results: BusinessSummary[],
  userLat: number,
  userLng: number,
): Promise<BusinessSummary[]> {
  if (results.length === 0) return results;

  const supabase = createAnonClient();
  const ids = results.map((r) => r.id);

  const { data } = await supabase
    .from("businesses")
    .select("id, latitude, longitude")
    .in("id", ids);

  const coordsMap = new Map(
    (data ?? []).map((row: any) => [row.id, { lat: row.latitude, lng: row.longitude }]),
  );

  const enriched = results.map((r) => {
    const coords = coordsMap.get(r.id);
    if (coords?.lat != null && coords?.lng != null) {
      return {
        ...r,
        distanceMeters: haversineDistance(userLat, userLng, coords.lat, coords.lng),
      };
    }
    return { ...r, distanceMeters: null };
  });

  enriched.sort((a, b) => {
    if (a.distanceMeters == null && b.distanceMeters == null) return 0;
    if (a.distanceMeters == null) return 1;
    if (b.distanceMeters == null) return -1;
    return a.distanceMeters - b.distanceMeters;
  });

  return enriched;
}
