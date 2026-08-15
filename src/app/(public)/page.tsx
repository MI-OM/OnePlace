import type { Metadata } from "next";
import { Compass, MessageCircle, Phone } from "lucide-react";

import {
  getCategories,
  listFeaturedBusinesses,
  type BusinessSummary,
  type Category,
} from "@/lib/discovery";
import { BusinessCard } from "@/components/discovery/business-card";
import { CategoryCard } from "@/components/discovery/category-card";
import { SearchBox } from "@/components/discovery/search-box";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "One Place — Find local services",
  description:
    "Discover local businesses, explore their services, and get answers without making five different calls.",
};

export default async function Home() {
  let categories: Category[] = [];
  let featured: BusinessSummary[] = [];

  try {
    const [allCategories, allFeatured] = await Promise.all([
      getCategories(),
      listFeaturedBusinesses(8),
    ]);
    categories = allCategories;
    featured = allFeatured;
  } catch {
    // Discovery sections render empty-state messaging when unavailable.
  }

  const browseCategories = categories.filter(
    (category) => category.businessCount > 0,
  );

  return (
    <>
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Find the service you need. Ask anything.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Discover local businesses, explore their services, and get answers
            without making five different calls.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBox size="large" placeholder="What are you looking for?" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Try &ldquo;massage this weekend&rdquo; · &ldquo;cleaning
            service&rdquo; · &ldquo;barber shop&rdquo;
          </p>
        </div>
      </section>

      {browseCategories.length > 0 && (
        <section className="px-6 pb-16">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                Browse by category
              </h2>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                render={<a href="/search" />}
              >
                Explore all
              </Button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {browseCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="bg-muted/40 px-6 py-16">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight">
              Featured businesses
            </h2>
            <p className="mt-1 text-muted-foreground">
              Hand-picked local services to get you started.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-16">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Finding help should be simple.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <Compass className="mx-auto size-6 text-primary" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">
                Tell us what you need
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Search by service, category or simply describe what
                you&apos;re looking for.
              </p>
            </div>
            <div className="text-center">
              <Phone className="mx-auto size-6 text-primary" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">
                Explore your options
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Compare local businesses, services and information in one
                place.
              </p>
            </div>
            <div className="text-center">
              <MessageCircle
                className="mx-auto size-6 text-primary"
                aria-hidden
              />
              <h3 className="mt-3 text-lg font-semibold">Ask or talk</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Get answers through chat or voice before you decide.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary px-6 py-16 text-primary-foreground">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your customers are already looking for you.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed opacity-90">
            Give them one clear place to find your services, ask questions and
            get in touch.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-8 bg-amber-warm text-primary-foreground hover:bg-amber-warm/90"
            render={<a href="/for-businesses" />}
          >
            Bring your business to One Place
          </Button>
        </div>
      </section>
    </>
  );
}
