import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, AlertTriangle } from "lucide-react";
import { Suspense } from "react";

import { searchBusinesses, enrichWithDistance, getCategories } from "@/lib/discovery";
import { BusinessCard } from "@/components/discovery/business-card";
import { SearchBox } from "@/components/discovery/search-box";
import { LocationButton } from "@/components/discovery/location-button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Search services — OnePlace",
  description:
    "Search local businesses by service, category or description.",
};

const SUGGESTIONS = ["massage", "hair", "cleaning", "fitness", "barber"];

const LOW_CONFIDENCE_THRESHOLD = 0.05;

async function SearchResults({
  query,
  lat,
  lng,
}: {
  query: string;
  lat?: number;
  lng?: number;
}) {
  let results = await searchBusinesses(query);

  if (lat != null && lng != null && results.length > 0) {
    results = await enrichWithDistance(results, lat, lng);
  }

  // Check if results are low confidence (all below threshold but above min)
  const lowConfidence =
    results.length > 0 &&
    results.every((r) => r.relevance != null && r.relevance < LOW_CONFIDENCE_THRESHOLD);

  if (results.length === 0) {
    // Fetch categories for suggestions
    let categories: { name: string; slug: string }[] = [];
    try {
      const allCategories = await getCategories();
      categories = allCategories.slice(0, 8);
    } catch {
      // Ignore — show default suggestions
    }

    return (
      <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold">No exact matches found</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          We couldn&apos;t find businesses matching &ldquo;{query}&rdquo;.
          Try a different term, or browse by category below.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <Link
              key={suggestion}
              href={`/search?q=${suggestion}`}
              className="rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {suggestion}
            </Link>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Or browse by category:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {lowConfidence && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>
            These results may not be exact matches. Try refining your search or
            browse categories for better results.
          </span>
        </div>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-40 rounded-xl" />
      ))}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lat?: string; lng?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const lat = params.lat ? parseFloat(params.lat) : undefined;
  const lng = params.lng ? parseFloat(params.lng) : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Find a service
      </h1>
      <p className="mt-1 text-muted-foreground">
        Search local businesses by service, category or description.
      </p>

      <div className="mt-6 flex items-end gap-3 max-w-xl">
        <div className="flex-1">
          <SearchBox
            defaultValue={query}
            autoFocus={!query}
            submitLabel="Search"
          />
        </div>
        <LocationButton />
      </div>

      {lat != null && lng != null && (
        <p className="mt-2 text-xs text-muted-foreground">
          Sorted by distance from your location.
        </p>
      )}

      {query ? (
        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults query={query} lat={lat} lng={lng} />
        </Suspense>
      ) : (
        <p className="mt-10 text-sm text-muted-foreground">
          Start by typing what you&apos;re looking for, for example
          &ldquo;massage&rdquo; or &ldquo;cleaning service&rdquo;.
        </p>
      )}
    </div>
  );
}
