"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";

import { startConversation } from "@/lib/chat/actions";
import { Button } from "@/components/ui/button";

export function StartConversation({
  businessId,
  businessSlug,
}: {
  businessId: string;
  businessSlug: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() =>
        startTransition(() =>
          startConversation(businessId, `/businesses/${businessSlug}`),
        )
      }
    >
      <MessageCircle className="size-4" aria-hidden />
      Talk to us
    </Button>
  );
}
