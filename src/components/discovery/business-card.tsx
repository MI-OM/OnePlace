import Link from "next/link";
import { MapPin } from "lucide-react";

import type { BusinessSummary } from "@/lib/discovery";
import { formatPrice } from "@/lib/format";
import { Rating } from "@/components/business/rating";

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

const PLACEHOLDER_GRADIENTS = [
  "from-violet-400 to-indigo-500",
  "from-rose-400 to-orange-400",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-fuchsia-400 to-pink-500",
];

function getPlaceholderGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length];
}

export function BusinessCard({ business }: { business: BusinessSummary }) {
  const location = [business.city, business.province].filter(Boolean).join(", ");

  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="group block h-full focus-visible:outline-none"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        {/* Cover image area */}
        <div className="relative h-44 overflow-hidden">
          {business.coverImageUrl ? (
            <img
              src={business.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${getPlaceholderGradient(business.id)}`}
            />
          )}

          {/* Logo overlay */}
          {business.logoUrl && (
            <div className="absolute bottom-3 left-3 flex size-12 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
              <img
                src={business.logoUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Price badge */}
          {business.priceFrom !== null && (
            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
              From {formatPrice(business.priceFrom)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-medium leading-snug">
                {business.name}
              </h3>
              {business.isSponsored && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                  Sponsored
                </span>
              )}
            </div>
            <Rating value={business.rating} count={business.reviewCount} />
          </div>

          {business.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {business.description}
            </p>
          )}

          <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted-foreground">
            {business.primaryCategoryName && (
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                {business.primaryCategoryName}
              </span>
            )}
            {business.distanceMeters != null && (
              <span className="flex items-center gap-0.5">
                <MapPin className="size-3" aria-hidden />
                {formatDistance(business.distanceMeters)}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="size-3" aria-hidden />
                {location}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
