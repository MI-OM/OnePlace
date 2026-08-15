"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { updateProfile } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function OnboardingForm() {
  const router = useRouter();

  async function handleSubmit(
    _prev: { error?: string } | undefined,
    formData: FormData,
  ) {
    const result = await updateProfile({
      displayName: String(formData.get("displayName") ?? ""),
      location: String(formData.get("location") ?? ""),
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
        <Label htmlFor="displayName">What should we call you?</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          maxLength={60}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">
          Where are you located?{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="location"
          name="location"
          type="text"
          placeholder="City or neighbourhood"
          maxLength={120}
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton pending={pending} className="sm:w-auto">
          Continue
        </SubmitButton>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
        >
          I&apos;ll do this later
        </Button>
      </div>
    </form>
  );
}
