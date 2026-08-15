import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
}: {
  value: number | null;
  count?: number;
  className?: string;
}) {
  if (value === null) {
    return null;
  }

  const filled = Math.round(value);

  return (
    <div
      className={cn("flex items-center gap-1.5 text-sm", className)}
      aria-label={`Rated ${value.toFixed(1)} out of 5${count !== undefined ? ` from ${count} reviews` : ""}`}
    >
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              "size-3.5",
              index < filled
                ? "fill-amber-warm text-amber-warm"
                : "text-border",
            )}
          />
        ))}
      </span>
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
