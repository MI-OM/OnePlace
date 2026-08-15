import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-2 text-muted-foreground">
        We couldn&apos;t find what you were looking for.
      </p>
      <Button render={<Link href="/search" />} className="mt-6">
        Explore services
      </Button>
    </div>
  );
}
