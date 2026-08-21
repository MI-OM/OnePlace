import type { Metadata } from "next";
import { Compass, MessageCircle, Phone } from "lucide-react";

import {
  getCategories,
  listFeaturedBusinesses,
  listSponsoredBusinesses,
  getTopRatedBusinesses,
  type BusinessSummary,
  type Category,
} from "@/lib/discovery";
import { BusinessCard } from "@/components/discovery/business-card";
import { CategoryCard } from "@/components/discovery/category-card";
import { SearchBox } from "@/components/discovery/search-box";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "OnePlace — Find local services",
  description:
    "Discover local businesses, explore their services, and get answers without making five different calls.",
};

export default async function Home() {
  let categories: Category[] = [];
  let featured: BusinessSummary[] = [];
  let topRated: BusinessSummary[] = [];
  let sponsored: BusinessSummary[] = [];

  try {
    const [allCategories, allFeatured, allTopRated, allSponsored] = await Promise.all([
      getCategories(),
      listFeaturedBusinesses(8),
      getTopRatedBusinesses(8),
      listSponsoredBusinesses(8),
    ]);
    categories = allCategories;
    featured = allFeatured;
    topRated = allTopRated;
    sponsored = allSponsored;
  } catch {
    // Discovery sections render empty-state messaging when unavailable.
  }

  const browseCategories = categories.filter(
    (category) => category.businessCount > 0,
  );

  return (
    <>
      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 py-20 sm:py-28">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative mx-auto w-full max-w-3xl text-center">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find the service you need.
            <br />
            <span className="text-white/80">Ask anything.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            Discover local businesses, explore their services, and get answers
            without making five different calls.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBox size="large" placeholder="What are you looking for?" />
          </div>
          <p className="mt-4 text-sm text-white/60">
            Try &ldquo;massage this weekend&rdquo; · &ldquo;cleaning
            service&rdquo; · &ldquo;barber shop&rdquo;
          </p>
        </div>
      </section>

      {/* ── Browse by Category ────────────────────────────────────────── */}
      {browseCategories.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Browse by category
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Find exactly what you&apos;re looking for.
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                render={<a href="/search" />}
              >
                Explore all
              </Button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {browseCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Sponsored Businesses ──────────────────────────────────────── */}
      {sponsored.length > 0 && (
        <section className="border-b border-amber-200 bg-amber-50/50 px-6 py-16 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="mx-auto w-full max-w-6xl">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Sponsored
                </h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Promoted
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Local businesses supporting OnePlace.
              </p>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sponsored.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Businesses ───────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-muted/30 px-6 py-16">
          <div className="mx-auto w-full max-w-6xl">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Featured businesses
              </h2>
              <p className="mt-1 text-muted-foreground">
                Hand-picked local services to get you started.
              </p>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Rated Businesses ─────────────────────────────────────── */}
      {topRated.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto w-full max-w-6xl">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Top rated businesses
              </h2>
              <p className="mt-1 text-muted-foreground">
                Highest rated by customers in your area.
              </p>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topRated.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Finding help should be simple.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Compass className="size-6" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Tell us what you need
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Search by service, category or simply describe what
                you&apos;re looking for.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <Phone className="size-6" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Explore your options
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Compare local businesses, services and information in one
                place.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400">
                <MessageCircle className="size-6" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Ask or talk</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Get answers through chat or voice before you decide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-16 text-white">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your customers are already looking for you.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/80">
            Give them one clear place to find your services, ask questions and
            get in touch.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-8 bg-white text-indigo-700 hover:bg-white/90"
            render={<a href="/for-businesses" />}
          >
            Bring your business to OnePlace
          </Button>
        </div>
      </section>
    </>
  );
}
