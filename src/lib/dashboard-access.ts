import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import {
  BUSINESS_ADMIN_ROLES,
  getBusinessRole,
  type BusinessRole,
} from "@/lib/authz";

export { BUSINESS_ADMIN_ROLES };

/**
 * Page guard for /dashboard/[businessId]/*. Call it in every page (not a
 * layout: layouts are not re-run on client navigation between sibling pages).
 * Signed-out users go to login; non-members get a 404 so business ids are
 * not confirmed to strangers.
 */
export async function requireDashboardAccess(
  businessId: string,
  roles?: BusinessRole[],
): Promise<{ userId: string; role: BusinessRole }> {
  const user = await getUser();
  if (!user) redirect(`/login?next=/dashboard/${businessId}`);

  const role = await getBusinessRole(user.id, businessId);
  if (!role || (roles && !roles.includes(role))) notFound();
  return { userId: user.id, role };
}
