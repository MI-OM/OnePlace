"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { updatePassword } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function UpdatePasswordForm() {
  const router = useRouter();

  async function handleSubmit(
    _prev: { error?: string } | undefined,
    formData: FormData,
  ) {
    const result = await updatePassword({
      password: String(formData.get("password") ?? ""),
    });
    if (result.error) return { error: result.error };
    router.push(result.redirectTo ?? "/account");
    router.refresh();
    return { error: undefined };
  }

  const [state, formAction, pending] = useActionState(handleSubmit, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a new password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters.
        </p>
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
