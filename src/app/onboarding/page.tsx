import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata = {
  title: "Set up your account — OnePlace",
};

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/onboarding");

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Let&apos;s get you set up
            </h1>
            <p className="text-sm text-muted-foreground">
              A few details will help us make OnePlace more useful for you.
            </p>
          </CardHeader>
          <CardContent>
            <OnboardingForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
