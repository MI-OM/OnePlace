import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { getUser } from "@/lib/auth";
import { getMyConversations } from "@/lib/chat/conversations";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Conversations — OnePlace",
  description: "Your conversations with local businesses.",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  active: "Active",
  waiting: "Waiting",
  human_requested: "Waiting for team",
  human_connected: "Team connected",
  closed: "Ended",
  failed: "Unavailable",
  archived: "Archived",
};

export default async function ConversationsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/conversations");
  }

  const conversations = await getMyConversations();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Conversations
      </h1>

      {conversations.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <MessageCircle
            className="mx-auto size-8 text-primary"
            aria-hidden
          />
          <h2 className="mt-4 text-lg font-semibold">Start a conversation</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Ask about services, pricing, availability, or anything else
            you&apos;d like to know.
          </p>
          <Button
            className="mt-6"
            render={<Link href="/search" />}
          >
            Find a business
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/conversations/${conversation.id}`}
                className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-semibold">
                    {conversation.businessName}
                  </h2>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {STATUS_LABELS[conversation.status] ?? "Active"}
                  </span>
                </div>
                {conversation.lastMessage ? (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {conversation.lastMessage}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No messages yet.
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
