import type { Metadata } from "next";
import { Compass, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About — One Place",
  description:
    "One Place helps you discover local businesses, explore their services, and get answers without making five different calls.",
};

export default function AboutPage() {
  return (
    <>
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Local help, in one place.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            One Place helps you discover local businesses, explore their
            services, and get answers without making five different calls.
          </p>
        </div>
      </section>

      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            How it works
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

      <section className="px-6 py-16">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to find your next service?
          </h2>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              render={<a href="/search" />}
            >
              Find a service
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<a href="/for-businesses" />}
            >
              For businesses
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
