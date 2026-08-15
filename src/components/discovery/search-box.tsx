import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SearchBox({
  defaultValue,
  placeholder = "What are you looking for?",
  submitLabel = "Find a service",
  autoFocus = false,
  size = "default",
}: {
  defaultValue?: string;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  size?: "default" | "large";
}) {
  return (
    <form action="/search" role="search" className="w-full">
      <div
        className={
          size === "large"
            ? "flex flex-col gap-3 sm:flex-row"
            : "flex flex-col gap-2 sm:flex-row"
        }
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={defaultValue}
            placeholder={placeholder}
            autoFocus={autoFocus}
            aria-label={placeholder}
            className={`w-full rounded-[10px] border border-input bg-card pr-4 text-foreground outline-none ring-ring transition focus-visible:ring-2 ${
              size === "large"
                ? "h-12 pl-12 text-base"
                : "h-11 pl-11 text-sm"
            }`}
          />
        </div>
        <Button
          type="submit"
          size={size === "large" ? "lg" : "default"}
          className={size === "large" ? "h-12 px-6" : "px-5"}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
