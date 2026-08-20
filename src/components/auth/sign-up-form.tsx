"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";

import { signUp } from "@/lib/auth/actions";
import { Captcha } from "@/components/auth/captcha";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState<string>();
  const [turnstileToken, setTurnstileToken] = useState("");
  const tokenRef = useRef("");

  function handleToken(token: string) {
    tokenRef.current = token;
    setTurnstileToken(token);
  }

  async function handleSubmit(
    _prev: { error?: string } | undefined,
    formData: FormData,
  ) {
    const pw = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");

    if (pw !== confirm) {
      setConfirmError("Passwords do not match.");
      return { error: "Passwords do not match." };
    }
    setConfirmError(undefined);

    const result = await signUp({
      email: String(formData.get("email") ?? ""),
      password: pw,
      turnstileToken: tokenRef.current,
    });
    if (result.error) return { error: result.error };
    router.push(result.redirectTo ?? "/");
    router.refresh();
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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          minLength={8}
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (confirmPassword && e.target.value !== confirmPassword) {
              setConfirmError("Passwords do not match.");
            } else {
              setConfirmError(undefined);
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (password && e.target.value !== password) {
              setConfirmError("Passwords do not match.");
            } else {
              setConfirmError(undefined);
            }
          }}
        />
        {confirmError ? (
          <p className="text-xs text-destructive">{confirmError}</p>
        ) : null}
      </div>

      <Captcha onVerify={handleToken} />

      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pending={pending}>Create account</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
