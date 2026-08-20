import { createClient } from "@/lib/supabase/server";

export type FavoriteBusiness = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
};

export type CustomerRequest = {
  id: string;
  requestType: string;
  status: string;
  requestedDate: string | null;
  notes: string | null;
  createdAt: string;
  businessId: string | null;
  businessName: string | null;
  businessSlug: string | null;
  conversationId: string | null;
};

async function currentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Please sign in to continue.");
  }
  return user.id;
}

/**
 * Returns the caller's saved businesses, most recently saved first.
 */
export async function getMyFavorites(): Promise<FavoriteBusiness[]> {
  const userId = await currentUserId();
  const supabase = await createClient();

  const { data } = await supabase
    .from("favorites")
    .select("created_at, business:businesses(id, name, slug, city)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const favorites: FavoriteBusiness[] = [];

  for (const favorite of data ?? []) {
    const business = (
      Array.isArray(favorite.business) ? favorite.business[0] : favorite.business
    ) as { id: string; name: string; slug: string; city: string | null } | null;
    if (!business) continue;

    favorites.push({
      id: business.id,
      name: business.name,
      slug: business.slug,
      city: business.city,
    });
  }

  return favorites;
}

/**
 * Returns the caller's service requests, newest first.
 */
export async function getMyRequests(): Promise<CustomerRequest[]> {
  const userId = await currentUserId();
  const supabase = await createClient();

  const { data } = await supabase
    .from("service_requests")
    .select(
      "id, request_type, status, requested_date, notes, created_at, conversation_id, business_id, business:businesses(id, name, slug)",
    )
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((request) => {
    const business = (
      Array.isArray(request.business) ? request.business[0] : request.business
    ) as { id: string; name: string; slug: string } | null;

    return {
      id: request.id,
      requestType: request.request_type,
      status: request.status,
      requestedDate: request.requested_date,
      notes: request.notes,
      createdAt: request.created_at,
      businessId: request.business_id,
      businessName: business?.name ?? null,
      businessSlug: business?.slug ?? null,
      conversationId: request.conversation_id,
    };
  });
}

/**
 * Returns whether the caller has saved a business.
 */
export async function isFavorited(businessId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("business_id")
    .eq("business_id", businessId)
    .maybeSingle();
  return Boolean(data);
}
