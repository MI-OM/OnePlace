"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function requestVerification(
  businessId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please sign in." };

    const { data: member } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!member) return { ok: false, error: "You don't have access to this business." };

    const service = createServiceClient();

    const { data: business } = await service
      .from("businesses")
      .select("verification_status")
      .eq("id", businessId)
      .maybeSingle();

    if (!business) return { ok: false, error: "Business not found." };
    if (business.verification_status === "verified") {
      return { ok: false, error: "Business is already verified." };
    }
    if (business.verification_status === "pending") {
      return { ok: false, error: "Verification already requested. Please wait for review." };
    }

    const { error } = await service
      .from("businesses")
      .update({
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
