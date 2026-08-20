import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "platform_admin")
    .maybeSingle();

  if (!role) throw new Error("You don't have admin access.");
  return user.id;
}

export type AdminBusiness = {
  id: string;
  name: string;
  slug: string;
  status: string;
  verificationStatus: string;
  city: string | null;
  province: string | null;
  createdAt: string;
  memberCount: number;
  isFeatured: boolean;
  isSponsored: boolean;
};

export type AdminReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  createdAt: string;
  businessName: string;
  reviewerName: string;
  reportReason: string | null;
  reportedAt: string | null;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  isActive: boolean;
  businessCount: number;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  businessCount: number;
  isPlatformAdmin: boolean;
};

export type AdminStats = {
  totalBusinesses: number;
  activeBusinesses: number;
  pendingVerifications: number;
  totalReviews: number;
  reportedReviews: number;
  totalConversations: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const service = createServiceClient();

  const [businesses, reviews, conversations] = await Promise.all([
    service.from("businesses").select("id, status, verification_status"),
    service.from("reviews").select("id, status"),
    service.from("conversations").select("id"),
  ]);

  const allBusinesses = businesses.data ?? [];
  return {
    totalBusinesses: allBusinesses.length,
    activeBusinesses: allBusinesses.filter((b) => b.status === "active").length,
    pendingVerifications: allBusinesses.filter(
      (b) => b.verification_status === "pending",
    ).length,
    totalReviews: (reviews.data ?? []).length,
    reportedReviews: (reviews.data ?? []).filter((r) => r.status === "hidden")
      .length,
    totalConversations: (conversations.data ?? []).length,
  };
}

export async function getAdminBusinesses(): Promise<AdminBusiness[]> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: businesses } = await service
    .from("businesses")
    .select("id, name, slug, status, verification_status, city, province, created_at, is_featured, is_sponsored")
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = (businesses ?? []).map((b) => b.id);
  const memberCounts = new Map<string, number>();

  if (ids.length > 0) {
    const { data: members } = await service
      .from("business_members")
      .select("business_id")
      .in("business_id", ids)
      .eq("status", "active");

    for (const m of members ?? []) {
      memberCounts.set(m.business_id, (memberCounts.get(m.business_id) ?? 0) + 1);
    }
  }

  return (businesses ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    status: b.status,
    verificationStatus: b.verification_status,
    city: b.city,
    province: b.province,
    createdAt: b.created_at,
    memberCount: memberCounts.get(b.id) ?? 0,
    isFeatured: b.is_featured,
    isSponsored: b.is_sponsored,
  }));
}

export async function getReportedReviews(): Promise<AdminReview[]> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: reviews } = await service
    .from("reviews")
    .select(
      "id, rating, title, body, status, created_at, report_reason, reported_at, business:businesses(name), reviewer:profiles!reviewer_id(display_name, first_name, last_name)",
    )
    .eq("status", "hidden")
    .order("reported_at", { ascending: false })
    .limit(50);

  return (reviews ?? []).map((r) => {
    const business = (
      Array.isArray(r.business) ? r.business[0] : r.business
    ) as { name: string } | null;
    const reviewer = (
      Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer
    ) as {
      display_name: string | null;
      first_name: string | null;
      last_name: string | null;
    } | null;

    const reviewerName =
      reviewer?.display_name ??
      ([reviewer?.first_name, reviewer?.last_name].filter(Boolean).join(" ") ||
        "Anonymous");

    return {
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      createdAt: r.created_at,
      businessName: business?.name ?? "Unknown",
      reviewerName,
      reportReason: r.report_reason,
      reportedAt: r.reported_at,
    };
  });
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: categories } = await service
    .from("categories")
    .select("id, name, slug, icon, image_url, is_active")
    .order("name");

  const ids = (categories ?? []).map((c) => c.id);
  const businessCounts = new Map<string, number>();

  if (ids.length > 0) {
    const { data: links } = await service
      .from("business_categories")
      .select("category_id")
      .in("category_id", ids);

    for (const l of links ?? []) {
      businessCounts.set(l.category_id, (businessCounts.get(l.category_id) ?? 0) + 1);
    }
  }

  return (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    imageUrl: c.image_url,
    isActive: c.is_active,
    businessCount: businessCounts.get(c.id) ?? 0,
  }));
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: profiles } = await service
    .from("profiles")
    .select("id, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: admins } = await service
    .from("user_roles")
    .select("user_id")
    .eq("role", "platform_admin");

  const adminSet = new Set((admins ?? []).map((a) => a.user_id));
  const ids = (profiles ?? []).map((p) => p.id);

  const { data: authUsers } = await service.auth.admin.listUsers({
    perPage: 200,
    page: 1,
  });

  const emailMap = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]),
  );

  const businessCounts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: members } = await service
      .from("business_members")
      .select("user_id")
      .in("user_id", ids)
      .eq("status", "active");

    for (const m of members ?? []) {
      businessCounts.set(m.user_id, (businessCounts.get(m.user_id) ?? 0) + 1);
    }
  }

  return (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailMap.get(p.id) ?? "",
    displayName: p.display_name,
    createdAt: p.created_at,
    businessCount: businessCounts.get(p.id) ?? 0,
    isPlatformAdmin: adminSet.has(p.id),
  }));
}
