import type { Metadata } from "next";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create an account — OnePlace",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your OnePlace account
        </h1>
        <p className="text-sm text-muted-foreground">
          Find services, talk to businesses, and get the help you need — all in
          one place.
        </p>
      </CardHeader>
      <CardContent>
        <SignUpForm next={next} />
      </CardContent>
    </Card>
  );
}
