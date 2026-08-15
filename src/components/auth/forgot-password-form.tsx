"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { resetPasswordForEmail } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function ForgotPasswordForm() {
  const router = useRouter();

  async function handleSubmit(
    _prev: { error?: string } | undefined,
    formData: FormData,
  ) {
    const result = await resetPasswordForEmail({
      email: String(formData.get("email") ?? ""),
    });
    if (result.error) return { error: result.error };
    router.push("/forgot-password/sent");
    return { error: undefined };
  }

  const [state, formAction, pending] = useActionState(handleSubmit, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  );
}
