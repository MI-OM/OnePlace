import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <SiteHeader />
      <section className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="mx-auto w-full max-w-2xl text-center">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Find the service you need. Ask anything.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Discover local businesses, explore their services, and get answers
            without making five different calls.
          </p>
          <form action="/search" className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                name="q"
                placeholder="What do you need help with?"
                className="h-12 flex-1 rounded-[10px] border border-input bg-card px-4 text-foreground outline-none ring-ring transition focus-visible:ring-2"
                aria-label="Search for a service"
              />
              <Button type="submit" size="lg" className="h-12">
                Find a service
              </Button>
            </div>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Try &ldquo;haircut near me&rdquo; · &ldquo;massage this weekend&rdquo;
            · &ldquo;cleaning service&rdquo;
          </p>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-5xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Finding help should be simple.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold">Tell us what you need</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Search by service, category or simply describe what
                you&apos;re looking for.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Explore your options</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Compare local businesses, services and information in one
                place.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ask or talk</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Get answers through chat or voice before you decide.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Real businesses. Useful answers.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            One Place brings business information and conversations together,
            so you can spend less time searching and more time getting things
            done.
          </p>
        </div>
      </section>

      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto w-full max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
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
    </main>
  );
}
