import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Heart, MessageCircle, Volume2 } from "lucide-react";

import { getProfile, getUser } from "@/lib/auth";
import { getMyFavorites, getMyRequests } from "@/lib/customer";
import { formatReviewDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SavedBusinessesList } from "@/components/favorites/saved-businesses";
import { SoundSettings } from "@/components/ui/sound-settings";

export const metadata: Metadata = {
  title: "Your account — OnePlace",
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  information: "Information",
  availability: "Check availability",
  quote: "Quote",
  booking: "Booking",
  callback: "Callback",
  other: "Other",
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  const profile = await getProfile();
  const [favorites, requests] = await Promise.all([
    getMyFavorites(),
    getMyRequests(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your OnePlace details.
      </p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              How you appear across OnePlace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-1.5">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">
                {profile?.display_name ?? "—"}
              </span>
            </div>
            <div className="grid gap-1.5">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email ?? "—"}</span>
            </div>
            <div className="grid gap-1.5">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">{profile?.location ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="size-4 text-primary" aria-hidden />
              Saved businesses
            </CardTitle>
            <CardDescription>
              Businesses you&apos;ve saved to come back to.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favorites.length === 0 ? (
              <div className="py-2 text-center">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t saved any businesses yet.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  render={<Link href="/search" />}
                >
                  Find a business
                </Button>
              </div>
            ) : (
              <SavedBusinessesList businesses={favorites} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-primary" aria-hidden />
              My requests
            </CardTitle>
            <CardDescription>
              Service requests you&apos;ve sent to businesses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                You haven&apos;t made any service requests yet. Chat with a
                business and use &ldquo;Request a service&rdquo;.
              </p>
            ) : (
              <ul className="space-y-3">
                {requests.map((request) => (
                  <li
                    key={request.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-medium">
                        {request.businessName ?? "Business"}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {REQUEST_STATUS_LABELS[request.status] ?? request.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {REQUEST_TYPE_LABELS[request.requestType] ??
                        request.requestType}
                      {" · "}
                      {formatReviewDate(request.createdAt)}
                    </p>
                    {request.requestedDate && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Requested for {formatReviewDate(request.requestedDate)}
                      </p>
                    )}
                    {request.conversationId && (
                      <Button
                        variant="link"
                        className="mt-2 h-auto px-0 text-sm"
                        render={
                          <Link href={`/conversations/${request.conversationId}`} />
                        }
                      >
                        View conversation
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" aria-hidden />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              render={<Link href="/conversations" />}
            >
              Open your conversations
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="size-4 text-primary" aria-hidden />
              Sounds
            </CardTitle>
            <CardDescription>
              Control ringtones and notification sounds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SoundSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              render={<Link href="/dashboard" />}
            >
              Business dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              render={<Link href="/update-password" />}
            >
              Change password
            </Button>
            <SignOutButton className="w-full sm:w-auto" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
