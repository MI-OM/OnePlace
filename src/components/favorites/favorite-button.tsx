"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { toggleFavorite } from "@/lib/customer-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function FavoriteButton({
  businessId,
  initiallyFavorited,
}: {
  businessId: string;
  initiallyFavorited: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const previous = favorited;
      setFavorited(!previous);

      const result = await toggleFavorite(businessId);
      if (result.error) {
        setFavorited(previous);
        toast.error(result.error);
        return;
      }
      setFavorited(result.favorited ?? previous);
      toast.success(
        result.favorited ? "Saved to your list." : "Removed from your list.",
      );
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={pending}
      onClick={handleToggle}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from saved businesses" : "Save business"}
    >
      <Heart
        className={
          favorited
            ? "size-4 fill-current text-primary"
            : "size-4 text-muted-foreground"
        }
        aria-hidden
      />
      {favorited ? "Saved" : "Save"}
    </Button>
  );
}
