"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
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

export async function updateBusinessStatus(
  businessId: string,
  status: "active" | "suspended" | "archived",
): Promise<void> {
  await requireAdmin();
  const service = createServiceClient();

  const { error } = await service
    .from("businesses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/businesses");
}

export async function updateVerificationStatus(
  businessId: string,
  verificationStatus: "unverified" | "pending" | "verified",
): Promise<void> {
  await requireAdmin();
  const service = createServiceClient();

  const { error } = await service
    .from("businesses")
    .update({
      verification_status: verificationStatus,
      verified_at:
        verificationStatus === "verified"
          ? new Date().toISOString()
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/businesses");
}

export async function moderateReportedReview(
  reviewId: string,
  status: "published" | "removed",
): Promise<void> {
  await requireAdmin();
  const service = createServiceClient();

  const { error } = await service
    .from("reviews")
    .update({ status, moderated_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/reviews");
}

export async function createCategory(data: {
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const { error } = await service.from("categories").insert({
      name: data.name,
      slug: data.slug,
      icon: data.icon || null,
      image_url: data.imageUrl || null,
      is_active: true,
    });

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateCategory(
  categoryId: string,
  data: { name?: string; icon?: string; imageUrl?: string; isActive?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.icon !== undefined) update.icon = data.icon || null;
    if (data.imageUrl !== undefined) update.image_url = data.imageUrl || null;
    if (data.isActive !== undefined) update.is_active = data.isActive;

    const { error } = await service
      .from("categories")
      .update(update)
      .eq("id", categoryId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteCategory(categoryId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const { count } = await service
      .from("business_categories")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (count && count > 0) {
      return { ok: false, error: `Category is used by ${count} businesses. Remove associations first.` };
    }

    const { error } = await service.from("categories").delete().eq("id", categoryId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function toggleAdminRole(
  userId: string,
  makeAdmin: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();

    if (makeAdmin) {
      const { error } = await service.from("user_roles").upsert(
        { user_id: userId, role: "platform_admin" },
        { onConflict: "user_id,role" },
      );
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await service
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "platform_admin");
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function toggleFeatured(
  businessId: string,
  featured: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const { error } = await service
      .from("businesses")
      .update({ is_featured: featured, updated_at: new Date().toISOString() })
      .eq("id", businessId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/businesses");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function toggleSponsored(
  businessId: string,
  sponsored: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const { error } = await service
      .from("businesses")
      .update({
        is_sponsored: sponsored,
        sponsored_at: sponsored ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/businesses");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateBusinessContent(
  businessId: string,
  data: {
    name?: string;
    description?: string;
    phone?: string;
    email?: string;
    websiteUrl?: string;
    addressLine1?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    timezone?: string;
    foundedYear?: number | null;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description || null;
    if (data.phone !== undefined) update.phone = data.phone || null;
    if (data.email !== undefined) update.email = data.email || null;
    if (data.websiteUrl !== undefined) update.website_url = data.websiteUrl || null;
    if (data.addressLine1 !== undefined) update.address_line1 = data.addressLine1 || null;
    if (data.city !== undefined) update.city = data.city || null;
    if (data.province !== undefined) update.province = data.province || null;
    if (data.postalCode !== undefined) update.postal_code = data.postalCode || null;
    if (data.country !== undefined) update.country = data.country || null;
    if (data.timezone !== undefined) update.timezone = data.timezone;
    if (data.foundedYear !== undefined) update.founded_year = data.foundedYear;

    const { error } = await service
      .from("businesses")
      .update(update)
      .eq("id", businessId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/businesses");
    revalidatePath(`/admin/businesses/${businessId}/edit`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function promoteToBusinessOwner(
  businessId: string,
  emailOrUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();

    let userId = emailOrUserId;

    // If it looks like an email, resolve to user ID
    if (emailOrUserId.includes("@")) {
      const { data: authUsers, error: listErr } =
        await service.auth.admin.listUsers({ perPage: 1000, page: 1 });
      if (listErr) return { ok: false, error: listErr.message };
      const found = (authUsers?.users ?? []).find(
        (u) => u.email?.toLowerCase() === emailOrUserId.toLowerCase(),
      );
      if (!found) return { ok: false, error: `No user found with email ${emailOrUserId}` };
      userId = found.id;
    }

    // Check not already a member
    const { data: existing } = await service
      .from("business_members")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return { ok: false, error: "This user is already a team member of this business." };
    }

    // Ensure profiles row exists
    const { data: profile } = await service
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile) {
      await service.from("profiles").insert({ id: userId, display_name: "Team Member" });
    }

    // Insert as owner
    const { error } = await service.from("business_members").insert({
      business_id: businessId,
      user_id: userId,
      role: "owner",
      status: "active",
    });

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/businesses/${businessId}/team`);
    revalidatePath("/admin/businesses");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
