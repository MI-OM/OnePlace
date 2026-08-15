import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function VerifiedBadge({
  className,
  label = "Verified business",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-primary",
        className,
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
