import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchX } from "lucide-react";

import { getCategoryBySlug, listBusinessesInCategory } from "@/lib/discovery";
import { BusinessCard } from "@/components/discovery/business-card";
import { SearchBox } from "@/components/discovery/search-box";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { title: "Category not found — OnePlace" };
  }
  return {
    title: `${category.name} in St. John's — OnePlace`,
    description:
      category.description ??
      `Find ${category.name.toLowerCase()} businesses and services nearby.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const businesses = await listBusinessesInCategory(category.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <nav
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/search" className="hover:text-foreground">
          All services
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {category.name}
      </h1>
      {category.description && (
        <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
          {category.description}
        </p>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        {businesses.length}{" "}
        {businesses.length === 1 ? "business" : "businesses"}
      </p>

      <div className="mt-6 max-w-xl">
        <SearchBox
          defaultValue={category.name}
          submitLabel="Search"
          autoFocus={false}
        />
      </div>

      {businesses.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <SearchX
            className="mx-auto size-8 text-muted-foreground"
            aria-hidden
          />
          <h2 className="mt-4 text-lg font-semibold">
            No businesses yet in this category
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Try a search, or explore other categories.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            Explore all services
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
}
