"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      className={className}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await signOut();
          router.push("/");
          router.refresh();
        });
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
