"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pending,
  className,
}: {
  children: React.ReactNode;
  pending: boolean;
  className?: string;
}) {
  return (
    <Button
      type="submit"
      className={cn("w-full", className)}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Please wait…" : children}
    </Button>
  );
}
