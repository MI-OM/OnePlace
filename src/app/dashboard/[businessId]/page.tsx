import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Inbox, MessageSquare, Settings, Star, ClipboardList, Users, BookOpen, CalendarDays, BarChart3 } from "lucide-react";

import { getUser } from "@/lib/auth";
import { getBusinessInbox, getBusinessStats } from "@/lib/chat/staff";
import { createServiceClient } from "@/lib/supabase/service";
import { VerificationBadge } from "@/components/business/verification-badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Inbox — OnePlace",
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

const ATTENTION_STATUSES = new Set(["human_requested", "waiting", "new"]);

export default async function BusinessInboxPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { businessId } = await params;
  const [inbox, stats] = await Promise.all([
    getBusinessInbox(businessId),
    getBusinessStats(businessId),
  ]);
  if (!inbox) {
    notFound();
  }

  const service = createServiceClient();
  const { data: businessData } = await service
    .from("businesses")
    .select("verification_status")
    .eq("id", businessId)
    .maybeSingle();

  const conversations = [...inbox.conversations].sort((a, b) => {
    const aAttention = Number(ATTENTION_STATUSES.has(a.status));
    const bAttention = Number(ATTENTION_STATUSES.has(b.status));
    if (aAttention !== bAttention) return bAttention - aAttention;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        render={<Link href="/dashboard" />}
      >
        <ArrowLeft className="size-4" aria-hidden />
        All businesses
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {inbox.business.name}
          </h1>
          <div className="mt-2">
            <VerificationBadge
              businessId={businessId}
              status={businessData?.verification_status ?? "unverified"}
            />
          </div>
        </div>
        <Button
          render={<Link href={`/dashboard/${businessId}/knowledge`} />}
          variant="ghost"
          size="sm"
        >
          <BookOpen className="mr-1.5 size-4" aria-hidden />
          Knowledge
        </Button>
        <Button
          render={<Link href={`/dashboard/${businessId}/requests`} />}
          variant="ghost"
          size="sm"
        >
          <ClipboardList className="mr-1.5 size-4" aria-hidden />
          Requests
        </Button>
        <Button
          render={<Link href={`/dashboard/${businessId}/bookings`} />}
          variant="ghost"
          size="sm"
        >
          <CalendarDays className="mr-1.5 size-4" aria-hidden />
          Bookings
        </Button>
        <Button
          render={<Link href={`/dashboard/${businessId}/team`} />}
          variant="ghost"
          size="sm"
        >
          <Users className="mr-1.5 size-4" aria-hidden />
          Team
        </Button>
        <Button
          render={<Link href={`/dashboard/${businessId}/analytics`} />}
          variant="ghost"
          size="sm"
        >
          <BarChart3 className="mr-1.5 size-4" aria-hidden />
          Analytics
        </Button>
        <Button
          render={<Link href={`/dashboard/${businessId}/availability`} />}
          variant="ghost"
          size="sm"
        >
          <CalendarDays className="mr-1.5 size-4" aria-hidden />
          Availability
        </Button>
        <Button
          render={<Link href={`/dashboard/${businessId}/settings`} />}
          variant="ghost"
          size="sm"
        >
          <Settings className="mr-1.5 size-4" aria-hidden />
          Settings
        </Button>
      </div>

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="size-4" aria-hidden />
              <span className="text-xs font-medium">Conversations</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{stats.totalConversations}</p>
            {stats.openConversations > 0 && (
              <p className="text-xs text-muted-foreground">
                {stats.openConversations} open
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClipboardList className="size-4" aria-hidden />
              <span className="text-xs font-medium">Requests</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{stats.totalRequests}</p>
            {stats.openRequests > 0 && (
              <Link
                href={`/dashboard/${businessId}/requests`}
                className="text-xs text-primary hover:underline"
              >
                {stats.openRequests} open
              </Link>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="size-4" aria-hidden />
              <span className="text-xs font-medium">Reviews</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{stats.totalReviews}</p>
            {stats.averageRating !== null && (
              <p className="text-xs text-muted-foreground">
                {stats.averageRating} avg
              </p>
            )}
          </div>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Inbox className="mx-auto size-8 text-primary" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">Your inbox is empty</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Customer conversations will appear here when people reach out.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/dashboard/conversations/${conversation.id}`}
                className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-semibold">{conversation.customerName}</h2>
                  <span
                    className={
                      ATTENTION_STATUSES.has(conversation.status)
                        ? "shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        : "shrink-0 text-xs font-medium text-muted-foreground"
                    }
                  >
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
