"use server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ToggleFavoriteResult = {
  favorited?: boolean;
  error?: string;
};

/**
 * Adds or removes a business from the caller's saved list. Goes through the
 * user client so RLS scopes every operation to the caller's own favorites.
 */
export async function toggleFavorite(
  businessId: string,
): Promise<ToggleFavoriteResult> {
  const user = await getUser();
  if (!user) {
    return { error: "Please sign in to save businesses." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("favorites")
    .select("business_id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("business_id", businessId)
      .eq("user_id", user.id);
    if (error) {
      return { error: "We couldn't update your saved businesses." };
    }
    return { favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ business_id: businessId, user_id: user.id });
  if (error) {
    return { error: "We couldn't save this business." };
  }
  return { favorited: true };
}
