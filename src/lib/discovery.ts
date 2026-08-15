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
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
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
};

const RPC = "list_businesses";

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
  };
}

export async function searchBusinesses(
  query: string,
  maxResults = 30,
): Promise<BusinessSummary[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc(RPC, {
    search_query: query,
    max_results: maxResults,
  });

  if (error) {
    throw new Error(`Couldn't search businesses: ${error.message}`);
  }

  return (data ?? []).map(toSummary);
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
  const { data, error } = await supabase.rpc(RPC, { max_results: maxResults });

  if (error) {
    throw new Error(`Couldn't load businesses: ${error.message}`);
  }

  return (data ?? []).map(toSummary);
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createAnonClient();

  const [categories, counts] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, icon, description, parent_id")
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
