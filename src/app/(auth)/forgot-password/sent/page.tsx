import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPasswordSentPage() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-4 pt-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If an account exists for that email, we&apos;ve sent instructions to
          reset your password.
        </p>
        <Button
          variant="outline"
          className="w-full"
          render={<Link href="/login" />}
        >
          Back to sign in
        </Button>
      </CardContent>
    </Card>
  );
}
