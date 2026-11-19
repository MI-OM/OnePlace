/**
 * Central authorization checks for server actions, route handlers and pages.
 *
 * Any function exported from a "use server" file is a public endpoint, and
 * most of them read through the service-role client (which bypasses RLS).
 * Call one of these before touching data.
 */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type BusinessRole = "owner" | "manager" | "staff";

/** Roles allowed to change business configuration, staff, or export data. */
export const BUSINESS_ADMIN_ROLES: BusinessRole[] = ["owner", "manager"];

export class AuthzError extends Error {
  constructor(
    message: string,
    public status: 401 | 403 = 403,
  ) {
    super(message);
    this.name = "AuthzError";
  }
}

export async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthzError("Please sign in.", 401);
  return user.id;
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "platform_admin")
    .maybeSingle();
  return Boolean(data);
}

/** Throws unless the caller is signed in and has the platform_admin role. */
export async function requirePlatformAdmin(): Promise<string> {
  const userId = await requireUserId();
  if (!(await isPlatformAdmin(userId))) {
    throw new AuthzError("You don't have admin access.");
  }
  return userId;
}

/**
 * Returns the caller's active role in a business, or null if they are not
 * an active member.
 */
export async function getBusinessRole(
  userId: string,
  businessId: string,
): Promise<BusinessRole | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return (data?.role as BusinessRole | undefined) ?? null;
}

/**
 * Throws unless the caller is an active member of the business, optionally
 * with one of the given roles. Returns the caller's id and role.
 */
export async function requireBusinessRole(
  businessId: string,
  roles?: BusinessRole[],
): Promise<{ userId: string; role: BusinessRole }> {
  const userId = await requireUserId();
  const role = await getBusinessRole(userId, businessId);
  if (!role) throw new AuthzError("You don't have access to this business.");
  if (roles && !roles.includes(role)) {
    throw new AuthzError("Only owners and managers can do this.");
  }
  return { userId, role };
}
