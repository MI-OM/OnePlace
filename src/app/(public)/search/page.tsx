import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Suspense } from "react";

import { searchBusinesses } from "@/lib/discovery";
import { BusinessCard } from "@/components/discovery/business-card";
import { SearchBox } from "@/components/discovery/search-box";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Search services — One Place",
  description:
    "Search local businesses by service, category or description.",
};

const SUGGESTIONS = ["massage", "hair", "cleaning", "fitness", "barber"];

async function SearchResults({ query }: { query: string }) {
  const results = await searchBusinesses(query);

  if (results.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold">No businesses matched</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Try a broader term, like &ldquo;cleaning&rdquo; or
          &ldquo;massage&rdquo;, or explore by category.
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
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
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
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Find a service
      </h1>
      <p className="mt-1 text-muted-foreground">
        Search local businesses by service, category or description.
      </p>

      <div className="mt-6 max-w-xl">
        <SearchBox
          defaultValue={query}
          autoFocus={!query}
          submitLabel="Search"
        />
      </div>

      {query ? (
        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults query={query} />
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
