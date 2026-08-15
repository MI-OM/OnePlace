import type { Metadata } from "next";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in — One Place",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue to One Place.
        </p>
      </CardHeader>
      <CardContent>
        {error === "verification_failed" ? (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            We couldn&apos;t verify your request. Please try again.
          </p>
        ) : null}
        <SignInForm next={next} />
      </CardContent>
    </Card>
  );
}
