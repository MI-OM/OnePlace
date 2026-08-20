import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAnonClient } from "@/lib/supabase/anon";
import type { SiteBusiness } from "@/components/site/templates/types";
import ClassicTemplate from "@/components/site/templates/classic";
import ModernTemplate from "@/components/site/templates/modern";
import MinimalTemplate from "@/components/site/templates/minimal";

type Row = {
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
  website_template: string;
  website_primary_color: string;
  website_accent_color: string;
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

function mapBusiness(row: Row): SiteBusiness {
  const published = row.reviews.filter(
    (r) => r.rating >= 1 && r.rating <= 5,
  );
  const reviewCount = published.length;
  const rating =
    reviewCount > 0
      ? Math.round(
          (published.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10,
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
    verificationStatus: row.verification_status as SiteBusiness["verificationStatus"],
    categories: row.categories.map((c) => ({
      id: c.category.id,
      name: c.category.name,
      slug: c.category.slug,
      icon: c.category.icon,
      description: c.category.description,
      parentId: c.category.parent_id,
      isPrimary: c.is_primary,
    })),
    services: row.services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      priceType: s.price_type as SiteBusiness["services"][number]["priceType"],
      minPrice: s.min_price,
      maxPrice: s.max_price,
      currency: s.currency,
      durationMinutes: s.duration_minutes,
    })),
    hours: row.hours.map((h) => ({
      dayOfWeek: h.day_of_week,
      isClosed: h.is_closed,
      opensAt: h.opens_at,
      closesAt: h.closes_at,
    })),
    reviews: row.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.created_at,
      reviewerName: r.reviewer
        ? r.reviewer.display_name ??
          [r.reviewer.first_name, r.reviewer.last_name]
            .filter(Boolean)
            .join(" ")
        : null,
    })),
    rating,
    reviewCount,
    websitePrimaryColor: row.website_primary_color,
    websiteAccentColor: row.website_accent_color,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("businesses")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return { title: "Not found" };

  return {
    title: `${data.name}`,
    description: data.description ?? undefined,
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAnonClient();

  const { data } = await supabase
    .from("businesses")
    .select(
      `
        id, name, slug, description, logo_url, cover_image_url,
        phone, email, website_url,
        address_line_1, city, province, postal_code, country, timezone,
        verification_status,
        website_template, website_primary_color, website_accent_color,
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

  if (!data) notFound();

  const { data: photos } = await supabase
    .from("business_photos")
    .select("url, alt_text")
    .eq("business_id", data.id)
    .order("sort_order");

  const business = mapBusiness(data as unknown as Row);
  const template = data.website_template ?? "classic";

  const props = { business, photos: photos ?? undefined };

  switch (template) {
    case "modern":
      return <ModernTemplate {...props} />;
    case "minimal":
      return <MinimalTemplate {...props} />;
    default:
      return <ClassicTemplate {...props} />;
  }
}
