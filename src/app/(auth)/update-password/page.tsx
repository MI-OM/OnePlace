import type { Metadata } from "next";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Set a new password — One Place",
};

export default function UpdatePasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a password you haven&apos;t used before.
        </p>
      </CardHeader>
      <CardContent>
        <UpdatePasswordForm />
      </CardContent>
    </Card>
  );
}
