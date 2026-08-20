import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Mail, MapPin, Phone } from "lucide-react";

import { getBusinessBySlug } from "@/lib/business";
import { isFavorited } from "@/lib/customer";
import { formatReviewDate } from "@/lib/format";
import { getBusinessDayIndex, getOpenNowStatus } from "@/lib/hours";
import { cn } from "@/lib/utils";
import { getSimilarBusinesses } from "@/lib/business/recommendations";
import { createAnonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { StartConversation } from "@/components/chat/start-conversation";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { HoursList } from "@/components/business/hours-list";
import { Rating } from "@/components/business/rating";
import { ReviewForm } from "@/components/business/review-form";
import { ReportReviewButton } from "@/components/business/report-review";
import { PhotoGallery } from "@/components/business/photo-gallery";
import { ServiceCard } from "@/components/business/service-card";
import { VerifiedBadge } from "@/components/business/verified-badge";
import { BusinessCard } from "@/components/discovery/business-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) {
    return { title: "Business not found — OnePlace" };
  }
  return {
    title: `${business.name} — OnePlace`,
    description:
      business.description ??
      `Find ${business.name} and their services on OnePlace.`,
    alternates: { canonical: `/businesses/${business.slug}` },
  };
}

function websiteHost(websiteUrl: string | null): string | null {
  if (!websiteUrl) {
    return null;
  }
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    return websiteUrl;
  }
}

async function SimilarBusinesses({ businessId }: { businessId: string }) {
  const similar = await getSimilarBusinesses(businessId, 6);
  if (similar.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight">Similar businesses</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {similar.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </div>
    </section>
  );
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) {
    notFound();
  }

  const favorited = await isFavorited(business.id);

  const supabase = createAnonClient();
  const { data: photos } = await supabase
    .from("business_photos")
    .select("url, alt_text, sort_order")
    .eq("business_id", business.id)
    .order("sort_order");

  const user = await getUser();
  let isOwner = false;
  let hasReviewed = false;
  if (user) {
    const authSupabase = await createClient();
    const { data: member } = await authSupabase
      .from("business_members")
      .select("id")
      .eq("business_id", business.id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    isOwner = !!member;

    if (!isOwner) {
      const { data: existingReview } = await authSupabase
        .from("reviews")
        .select("id")
        .eq("business_id", business.id)
        .eq("reviewer_id", user.id)
        .maybeSingle();
      hasReviewed = !!existingReview;
    }
  }

  const status = getOpenNowStatus(business.hours, business.timezone);
  const todayIndex = getBusinessDayIndex(business.timezone);
  const hostname = websiteHost(business.websiteUrl);
  const address = [
    business.addressLine1,
    business.city,
    business.province,
    business.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* Cover image hero */}
      {business.coverImageUrl && (
        <div className="relative -mx-6 mb-8 h-64 overflow-hidden sm:h-80 lg:h-96">
          <img
            src={business.coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/search" className="hover:text-foreground">
          Back to search
        </Link>
      </nav>

      <header className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex items-start gap-4">
            {/* Logo */}
            {business.logoUrl && (
              <div className="hidden size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-sm sm:flex">
                <img
                  src={business.logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {business.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Rating value={business.rating} count={business.reviewCount} />
                {business.verificationStatus === "verified" && (
                  <VerifiedBadge />
                )}
              </div>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-medium",
              status.open ? "text-green-700" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                status.open ? "bg-green-600" : "bg-muted-foreground/50",
              )}
              aria-hidden
            />
            {status.label}
          </span>
        </div>

        {business.city && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden />
            {[business.city, business.province].filter(Boolean).join(", ")}
          </p>
        )}

        {business.categories.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {business.categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="inline-block rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      {photos && photos.length > 0 && (
        <PhotoGallery photos={photos} />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <StartConversation
          businessId={business.id}
          businessSlug={business.slug}
        />
        <FavoriteButton
          businessId={business.id}
          initiallyFavorited={favorited}
        />
        <p className="max-w-md text-sm text-muted-foreground">
          Ask a question, find out what&apos;s available, or get help choosing
          the right service.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {business.description && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">About</h2>
              <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
                {business.description}
              </p>
            </section>
          )}

          {business.services.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">
                Services
              </h2>
              <ul className="mt-3 space-y-3">
                {business.services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </ul>
            </section>
          )}

          {business.reviews.length > 0 && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold tracking-tight">
                  Reviews
                </h2>
                <Rating
                  value={business.rating}
                  count={business.reviewCount}
                />
              </div>
              <ul className="mt-3 space-y-3">
                {business.reviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Rating value={review.rating} />
                      <div className="flex items-center gap-3">
                        <ReportReviewButton
                          reviewId={review.id}
                          businessId={business.id}
                          isOwner={isOwner}
                        />
                        <span className="text-xs text-muted-foreground">
                          {formatReviewDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    {review.title && (
                      <h3 className="mt-2 font-medium">{review.title}</h3>
                    )}
                    {review.body && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {review.body}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {review.reviewerName ?? "Anonymous"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isOwner && user && (
            <section>
              <ReviewForm businessId={business.id} hasReviewed={hasReviewed} />
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <HoursList hours={business.hours} highlightDay={todayIndex} />
            </CardContent>
          </Card>

          {(business.phone ||
            business.email ||
            business.websiteUrl ||
            address) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="size-4 shrink-0 text-primary" aria-hidden />
                    {business.phone}
                  </a>
                )}
                {business.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-2 break-all text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="size-4 shrink-0 text-primary" aria-hidden />
                    {business.email}
                  </a>
                )}
                {business.websiteUrl && (
                  <a
                    href={business.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Globe
                      className="size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    {hostname ?? business.websiteUrl}
                  </a>
                )}
                {address && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    {address}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Similar businesses */}
      <SimilarBusinesses businessId={business.id} />
    </div>
  );
}
