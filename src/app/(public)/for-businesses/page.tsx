import type { Metadata } from "next";
import { MessageCircle, PhoneCall, Store } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For businesses — OnePlace",
  description:
    "Put your services in one place and make it easier for customers to find and contact you.",
};

export default function ForBusinessesPage() {
  return (
    <>
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Do you run a service business?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Put your services in one place and make it easier for customers to
            find and contact you.
          </p>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              render={<a href="/onboarding/business">List your business</a>}
            >
              List your business
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<a href="/search">See how customers search</a>}
            >
              See how customers search
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Your profile is free to start. Listing tools are rolling out over
            the coming milestones.
          </p>
        </div>
      </section>

      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            What OnePlace does for your business
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <Store className="mx-auto size-6 text-primary" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">One clear listing</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Your services, hours, location and contact details together in
                one place customers can actually find.
              </p>
            </div>
            <div className="text-center">
              <PhoneCall className="mx-auto size-6 text-primary" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">Reach local customers</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                People search for exactly what you offer — massage, cleaning,
                barber shops — in your area.
              </p>
            </div>
            <div className="text-center">
              <MessageCircle className="mx-auto size-6 text-primary" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">Answer, don&apos;t explain</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Customers get the basics from your listing, so calls are about
                real questions, not opening hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Start with your free profile.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Create an account and get ready for when your listing goes live.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-8 bg-amber-warm text-primary-foreground hover:bg-amber-warm/90"
            render={<a href="/onboarding/business">Bring your business to OnePlace</a>}
          >
            Bring your business to OnePlace
          </Button>
        </div>
      </section>
    </>
  );
}
