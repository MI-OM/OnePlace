"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

async function requireBusinessAdmin(businessId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");

  const { data: member } = await supabase
    .from("business_members")
    .select("id, role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "manager"])
    .maybeSingle();

  if (!member) throw new Error("Only owners and managers can manage staff.");
  return user.id;
}

// ─────────────────────────────────────────────
// Staff invitation
// ─────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["manager", "staff"]),
});

// Check if a profiles row exists for a user ID
async function ensureProfilesRow(userId: string, supabase: any) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) {
    // Create a minimal profiles row
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      email: null,
      display_name: null,
      first_name: null,
      last_name: null,
      avatar_url: null,
      bio: null,
    });
    if (error) console.error("Failed to create profiles row:", error);
  }
}

export async function inviteStaff(
  businessId: string,
  data: z.infer<typeof inviteSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessAdmin(businessId);
    const parsed = inviteSchema.parse(data);
    const service = createServiceClient();

    // Find user by email in Supabase Auth
    const { data: authUsers } = await service.auth.admin.listUsers();
    const targetUser = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === parsed.email.toLowerCase(),
    );

    if (!targetUser) {
      return {
        ok: false,
        error: "No account found with that email. They need to sign up first.",
      };
    }

    // Check not already a member
    const { data: existing } = await service
      .from("business_members")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (existing) {
      return { ok: false, error: "This person is already a team member." };
    }

    const { error } = await service.from("business_members").insert({
      business_id: businessId,
      user_id: targetUser.id,
      role: parsed.role,
      status: "active",
    });

    if (error) return { ok: false, error: error.message };

    // Ensure the user has a profiles row so they appear in team member selector
    await ensureProfilesRow(targetUser.id, service);

    revalidatePath(`/dashboard/${businessId}/team`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─────────────────────────────────────────────
// Staff role management
// ─────────────────────────────────────────────

export async function updateStaffRole(
  businessId: string,
  memberId: string,
  role: "owner" | "manager" | "staff",
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessAdmin(businessId);
    const service = createServiceClient();

    const { error } = await service
      .from("business_members")
      .update({ role })
      .eq("id", memberId)
      .eq("business_id", businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}/team`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function removeStaff(
  businessId: string,
  memberId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessAdmin(businessId);
    const service = createServiceClient();

    const { error } = await service
      .from("business_members")
      .update({ status: "removed" })
      .eq("id", memberId)
      .eq("business_id", businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}/team`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─────────────────────────────────────────────
// Staff availability
// ─────────────────────────────────────────────

const availabilitySchema = z.object({
  memberId: z.string().uuid(),
  schedule: z.array(
    z.object({
      day: z.number().min(0).max(6),
      isAvailable: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
    }),
  ),
});

export async function updateStaffAvailability(
  businessId: string,
  data: z.infer<typeof availabilitySchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in.");

    // Staff can update their own availability; admins can update anyone's
    const { data: member } = await supabase
      .from("business_members")
      .select("id, role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const isOwn = data.memberId === member?.id;
    const isAdmin = member?.role === "owner" || member?.role === "manager";

    if (!isOwn && !isAdmin) {
      return { ok: false, error: "You can only update your own availability." };
    }

    const parsed = availabilitySchema.parse(data);
    const service = createServiceClient();

    for (const entry of parsed.schedule) {
      const { error } = await service
        .from("staff_availability")
        .upsert(
          {
            staff_member_id: parsed.memberId,
            day_of_week: entry.day,
            is_available: entry.isAvailable,
            start_time: entry.startTime,
            end_time: entry.endTime,
          },
          { onConflict: "staff_member_id,day_of_week" },
        );

      if (error) return { ok: false, error: error.message };
    }

    revalidatePath(`/dashboard/${businessId}/team`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─────────────────────────────────────────────
// Staff specialties
// ─────────────────────────────────────────────

export async function updateStaffSpecialties(
  businessId: string,
  memberId: string,
  serviceIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessAdmin(businessId);
    const service = createServiceClient();

    // Delete existing
    await service
      .from("staff_specialties")
      .delete()
      .eq("staff_member_id", memberId);

    // Insert new
    if (serviceIds.length > 0) {
      const { error } = await service.from("staff_specialties").insert(
        serviceIds.map((sid) => ({
          staff_member_id: memberId,
          service_id: sid,
        })),
      );
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath(`/dashboard/${businessId}/team`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
