import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold tracking-tight">One Place</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Find local services in one place.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm sm:ml-auto">
          <Link
            href="/search"
            className="text-muted-foreground hover:text-foreground"
          >
            Explore
          </Link>
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground"
          >
            About
          </Link>
          <Link
            href="/for-businesses"
            className="text-muted-foreground hover:text-foreground"
          >
            For businesses
          </Link>
        </nav>
      </div>
    </footer>
  );
}
