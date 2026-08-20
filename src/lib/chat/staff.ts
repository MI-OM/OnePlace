import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type StaffBusiness = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "manager" | "staff";
  memberStatus: string;
};

export type StaffConversation = {
  id: string;
  customerId: string | null;
  customerName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
};

export type StaffConversationThread = {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  customerId: string | null;
  customerName: string;
  status: string;
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

function formatCustomerName(customer: {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
} | null): string {
  if (!customer) return "Customer";
  const full =
    customer.display_name ??
    [customer.first_name, customer.last_name].filter(Boolean).join(" ");
  return full.trim().length > 0 ? full : "Customer";
}

/**
 * Returns the businesses the caller belongs to (RLS gates membership).
 */
export async function getMyBusinesses(): Promise<StaffBusiness[]> {
  await currentUserId();
  const supabase = await createClient();

  const { data } = await supabase
    .from("business_members")
    .select("role, status, business:businesses(id, name, slug)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const rows: StaffBusiness[] = [];

  for (const member of data ?? []) {
    const business = (
      Array.isArray(member.business) ? member.business[0] : member.business
    ) as { id: string; name: string; slug: string } | null;
    if (!business) continue;

    rows.push({
      id: business.id,
      name: business.name,
      slug: business.slug,
      role: member.role as StaffBusiness["role"],
      memberStatus: member.status,
    });
  }

  return rows;
}

/**
 * Returns whether the caller is an active member of a business.
 */
export async function isMemberOf(businessId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", await currentUserId())
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

/**
 * Returns the conversations for a business the caller belongs to, newest
 * activity first, with the customer's name and the latest message.
 * The customer profile read uses the service-role client because profile
 * rows are only visible to their owner under RLS.
 */
export async function getBusinessInbox(
  businessId: string,
): Promise<{
  business: { id: string; name: string; slug: string };
  conversations: StaffConversation[];
} | null> {
  const supabase = await createClient();
  const service = createServiceClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (!business || !(await isMemberOf(businessId))) {
    return null;
  }

  const { data: conversations } = await service
    .from("conversations")
    .select(
      "id, customer_id, status, created_at, updated_at, customer:profiles(id, display_name, first_name, last_name)",
    )
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .limit(50);

  const ids = (conversations ?? []).map((conversation) => conversation.id);
  const lastByConversation = new Map<string, string>();

  if (ids.length > 0) {
    const { data: messages } = await service
      .from("messages")
      .select("conversation_id, content, sender_type")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false });

    for (const message of messages ?? []) {
      if (
        message.sender_type === "system" ||
        !message.content ||
        lastByConversation.has(message.conversation_id)
      ) {
        continue;
      }
      lastByConversation.set(message.conversation_id, message.content);
    }
  }

  const conversationsList: StaffConversation[] = (conversations ?? []).map(
    (conversation) => {
      const customer = (
        Array.isArray(conversation.customer)
          ? conversation.customer[0]
          : conversation.customer
      ) as {
        id: string | null;
        display_name: string | null;
        first_name: string | null;
        last_name: string | null;
      } | null;

      return {
        id: conversation.id,
        customerId: conversation.customer_id,
        customerName: formatCustomerName(customer),
        status: conversation.status,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        lastMessage: lastByConversation.get(conversation.id) ?? null,
      };
    },
  );

  return { business, conversations: conversationsList };
}

/**
 * Returns a single conversation for the staff thread page, gated to members
 * of the business the conversation belongs to.
 */
export async function getStaffConversation(
  conversationId: string,
): Promise<StaffConversationThread | null> {
  const supabase = await createClient();
  const service = createServiceClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, business_id, customer_id, status")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation?.business_id || !(await isMemberOf(conversation.business_id))) {
    return null;
  }

  const { data: business } = await service
    .from("businesses")
    .select("id, name, slug")
    .eq("id", conversation.business_id)
    .maybeSingle();

  if (!business) {
    return null;
  }

  let customerName = "Customer";
  if (conversation.customer_id) {
    const { data: customer } = await service
      .from("profiles")
      .select("display_name, first_name, last_name")
      .eq("id", conversation.customer_id)
      .maybeSingle();
    customerName = formatCustomerName(customer as never);
  }

  return {
    id: conversation.id,
    businessId: business.id,
    businessName: business.name,
    businessSlug: business.slug,
    customerId: conversation.customer_id,
    customerName,
    status: conversation.status,
  };
}

export type BusinessStats = {
  totalConversations: number;
  openConversations: number;
  totalRequests: number;
  openRequests: number;
  totalReviews: number;
  averageRating: number | null;
};

/**
 * Returns dashboard stats for a business the caller belongs to.
 */
export async function getBusinessStats(
  businessId: string,
): Promise<BusinessStats | null> {
  const supabase = await createClient();
  const service = createServiceClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .maybeSingle();

  if (!business || !(await isMemberOf(businessId))) {
    return null;
  }

  const [conversationsResult, requestsResult, reviewsResult] =
    await Promise.all([
      service
        .from("conversations")
        .select("id, status", { count: "exact", head: false })
        .eq("business_id", businessId),
      service
        .from("service_requests")
        .select("id, status", { count: "exact", head: false })
        .eq("business_id", businessId),
      service
        .from("reviews")
        .select("id, rating", { count: "exact", head: false })
        .eq("business_id", businessId)
        .eq("status", "published"),
    ]);

  const allConversations = conversationsResult.data ?? [];
  const openConversations = allConversations.filter(
    (c) => c.status !== "closed" && c.status !== "failed",
  ).length;

  const allRequests = requestsResult.data ?? [];
  const openRequests = allRequests.filter(
    (r) => r.status === "open" || r.status === "pending",
  ).length;

  const reviews = reviewsResult.data ?? [];
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
            totalReviews) *
            10,
        ) / 10
      : null;

  return {
    totalConversations: allConversations.length,
    openConversations,
    totalRequests: allRequests.length,
    openRequests,
    totalReviews,
    averageRating,
  };
}
