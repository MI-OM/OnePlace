import { createAnonClient } from "@/lib/supabase/anon";

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  parentName: string | null;
};

export type CatalogService = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
};

export type BusinessCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
  isPrimary: boolean;
};

export type BusinessService = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  priceType: "fixed" | "starting_from" | "range" | "quote_required";
  minPrice: number | null;
  maxPrice: number | null;
  currency: string;
  durationMinutes: number | null;
};

export type BusinessHoursRow = {
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
};

export type BusinessReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  reviewerName: string | null;
};

export type BusinessProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  addressLine1: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  timezone: string;
  verificationStatus: "unverified" | "pending" | "verified";
  categories: BusinessCategory[];
  services: BusinessService[];
  hours: BusinessHoursRow[];
  reviews: BusinessReview[];
  rating: number | null;
  reviewCount: number;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  address_line_1: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  timezone: string;
  verification_status: string;
  categories: {
    is_primary: boolean;
    category: {
      id: string;
      name: string;
      slug: string;
      icon: string | null;
      description: string | null;
      parent_id: string | null;
    };
  }[];
  services: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    price_type: string;
    min_price: number | null;
    max_price: number | null;
    currency: string;
    duration_minutes: number | null;
  }[];
  hours: {
    day_of_week: number;
    is_closed: boolean;
    opens_at: string | null;
    closes_at: string | null;
  }[];
  reviews: {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    created_at: string;
    reviewer: {
      id: string;
      display_name: string | null;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }[];
};

export async function getBusinessBySlug(
  slug: string,
): Promise<BusinessProfile | null> {
  const supabase = createAnonClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
        id, name, slug, description, logo_url, cover_image_url,
        phone, email, website_url,
        address_line_1, city, province, postal_code, country, timezone,
        verification_status,
        categories:business_categories(
          is_primary,
          category:categories(id, name, slug, icon, description, parent_id)
        ),
        services:business_services(
          id, name, description, price, price_type, min_price, max_price,
          currency, duration_minutes
        ),
        hours:business_hours(day_of_week, is_closed, opens_at, closes_at),
        reviews:reviews(
          id, rating, title, body, created_at,
          reviewer:profiles!reviewer_id(id, display_name, first_name, last_name)
        )
      `,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .eq("services.is_active", true)
    .eq("reviews.status", "published")
    .order("day_of_week", { referencedTable: "hours" })
    .order("created_at", { referencedTable: "services" })
    .order("created_at", { referencedTable: "reviews", ascending: false })
    .maybeSingle();

  if (error) {
    throw new Error(`Couldn't load business: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const row = data as unknown as BusinessRow;

  const published = row.reviews.filter(
    (review) => review.rating >= 1 && review.rating <= 5,
  );
  const reviewCount = published.length;
  const rating =
    reviewCount > 0
      ? Math.round(
          (published.reduce((sum, review) => sum + review.rating, 0) /
            reviewCount) *
            10,
        ) / 10
      : null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    phone: row.phone,
    email: row.email,
    websiteUrl: row.website_url,
    addressLine1: row.address_line_1,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    country: row.country,
    timezone: row.timezone,
    verificationStatus: row.verification_status as BusinessProfile["verificationStatus"],
    categories: (row.categories ?? [])
      .map((link) => ({
        id: link.category.id,
        name: link.category.name,
        slug: link.category.slug,
        icon: link.category.icon,
        description: link.category.description,
        parentId: link.category.parent_id,
        isPrimary: link.is_primary,
      }))
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)),
    services: (row.services ?? []).map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      priceType: service.price_type as BusinessService["priceType"],
      minPrice: service.min_price,
      maxPrice: service.max_price,
      currency: service.currency,
      durationMinutes: service.duration_minutes,
    })),
    hours: (row.hours ?? []).map((hours) => ({
      dayOfWeek: hours.day_of_week,
      isClosed: hours.is_closed,
      opensAt: hours.opens_at,
      closesAt: hours.closes_at,
    })),
    reviews: (row.reviews ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      createdAt: review.created_at,
      reviewerName:
        review.reviewer?.display_name ??
        [review.reviewer?.first_name, review.reviewer?.last_name]
          .filter(Boolean)
          .join(" "),
    })),
    rating,
    reviewCount,
  };
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, icon, parent_id")
    .eq("is_active", true)
    .order("sort_order");

  const rows = data ?? [];
  const parentMap = new Map(rows.map((r) => [r.id, r.name]));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    parentId: row.parent_id,
    parentName: row.parent_id ? (parentMap.get(row.parent_id) ?? null) : null,
  }));
}

export async function getCatalogServices(): Promise<CatalogService[]> {
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, description, category_id")
    .eq("is_active", true);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
  }));
}
