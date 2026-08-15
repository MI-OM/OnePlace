import { cache } from "react";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  timezone: string | null;
  location: string | null;
  locale: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Returns the authenticated user or null. Cached per-request so repeated
 * lookups in the same render share one Supabase call.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Returns the caller's profile row or null when not signed in.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
});

/**
 * Returns the caller's role names from user_roles.
 */
export const getRoles = cache(async (): Promise<string[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return (data ?? []).map((row) => row.role);
});
