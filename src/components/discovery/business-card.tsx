import Link from "next/link";

import type { BusinessSummary } from "@/lib/discovery";
import { formatPrice } from "@/lib/format";
import { Rating } from "@/components/business/rating";

export function BusinessCard({ business }: { business: BusinessSummary }) {
  const location = [business.city, business.province].filter(Boolean).join(", ");

  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="group block h-full focus-visible:outline-none"
    >
      <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors group-hover:bg-muted/40 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-base font-medium">{business.name}</h3>
          <Rating value={business.rating} count={business.reviewCount} />
        </div>
        {business.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {business.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-muted-foreground">
          {business.primaryCategoryName && (
            <span className="font-medium text-foreground">
              {business.primaryCategoryName}
            </span>
          )}
          {business.primaryCategoryName && (location || business.priceFrom) && (
            <span aria-hidden>·</span>
          )}
          {location && <span>{location}</span>}
          {business.priceFrom !== null && (
            <>
              <span aria-hidden>·</span>
              <span>{formatPrice(business.priceFrom)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
