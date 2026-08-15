import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getProfile, getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = {
  title: "Your account — One Place",
};

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  const profile = await getProfile();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your One Place details.
      </p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              How you appear across One Place.
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
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
