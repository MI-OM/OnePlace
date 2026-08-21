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
  const [submittedEmail, setSubmittedEmail] = useState<string>();

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
    if (result.needsConfirmation) {
      setSubmittedEmail(result.email);
      return { error: undefined };
    }
    router.push(result.redirectTo ?? "/");
    router.refresh();
    return { error: undefined };
  }

  const [state, formAction, pending] = useActionState(handleSubmit, undefined);

  if (submittedEmail) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="size-6 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          Check your email
        </h2>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{submittedEmail}</span>.
          Click the link in the email to confirm your account.
        </p>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <button
            type="button"
            onClick={() => setSubmittedEmail(undefined)}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            try a different email
          </button>
          .
        </p>
      </div>
    );
  }

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
