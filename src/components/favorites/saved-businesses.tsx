"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { toggleFavorite } from "@/lib/customer-actions";
import type { FavoriteBusiness } from "@/lib/customer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SavedBusinessesList({
  businesses,
}: {
  businesses: FavoriteBusiness[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRemove(business: FavoriteBusiness) {
    startTransition(async () => {
      const result = await toggleFavorite(business.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Removed from your list.");
      router.refresh();
    });
  }

  return (
    <ul className="space-y-3">
      {businesses.map((business) => (
        <li
          key={business.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
        >
          <Link
            href={`/businesses/${business.slug}`}
            className="min-w-0 transition-colors hover:text-foreground"
          >
            <span className="block truncate font-medium">{business.name}</span>
            {business.city && (
              <span className="block truncate text-sm text-muted-foreground">
                {business.city}
              </span>
            )}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={pending}
            onClick={() => handleRemove(business)}
            aria-label={`Remove ${business.name} from saved businesses`}
          >
            <Heart className="size-4 fill-current text-primary" aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  );
}
