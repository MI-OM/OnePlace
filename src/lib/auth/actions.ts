"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type ActionResult = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  needsConfirmation?: boolean;
  email?: string;
};

const emailSchema = z.string().trim().email("Enter a valid email address.");

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const onboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Tell us what to call you.")
    .max(60, "Keep your name under 60 characters."),
  location: z.string().trim().max(120, "Keep your location under 120 characters.").optional(),
});

function toMessage(code: string | undefined): string | undefined {
  switch (code) {
    case "invalid_credentials":
      return "The email or password you entered is incorrect.";
    case "email_not_confirmed":
      return "Please verify your email address before signing in.";
    case "user_already_exists":
      return "An account with that email already exists. Try signing in instead.";
    case "over_email_send_rate_limit":
      return "You've made too many requests. Please wait a moment and try again.";
    case "weak_password":
      return "That password is too weak. Use at least 8 characters.";
    default:
      return undefined;
  }
}

function errorFrom(authError: { code?: string; message: string }): string {
  return (
    toMessage(authError.code) ??
    "Something went wrong. Please try again."
  );
}

export async function signIn(
  input: { email: string; password: string },
  redirectTo = "/",
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: errorFrom(error) };
  return { success: true, redirectTo };
}

export async function signUp(
  input: { email: string; password: string },
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) return { error: errorFrom(error) };

  // When email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return { success: true, needsConfirmation: true, email: parsed.data.email };
  }

  return { success: true, redirectTo: "/onboarding" };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function resetPasswordForEmail(
  input: { email: string },
): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/update-password`,
  });

  // Return success regardless so we never reveal whether an account exists.
  return { success: true };
}

export async function updatePassword(
  input: { password: string },
): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { error: errorFrom(error) };
  return { success: true, redirectTo: "/account" };
}

export async function updateProfile(
  input: { displayName: string; location?: string },
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to continue." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      first_name: parsed.data.displayName,
      ...(parsed.data.location ? { location: parsed.data.location } : {}),
    })
    .eq("id", user.id);

  if (error) return { error: "We couldn't save your details. Please try again." };
  return { success: true, redirectTo: "/" };
}
