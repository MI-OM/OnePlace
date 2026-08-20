"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

async function requireBusinessMember(businessId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");

  const { data: member } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member) throw new Error("You don't have access to this business.");
  return user.id;
}

export type ExceptionEntry = {
  id: string;
  exceptionDate: string;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  reason: string | null;
};

export async function getExceptions(
  businessId: string,
  year: number,
  month: number,
): Promise<ExceptionEntry[]> {
  await requireBusinessMember(businessId);
  const service = createServiceClient();

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data } = await service
    .from("availability_exceptions")
    .select("id, exception_date, is_closed, opens_at, closes_at, reason")
    .eq("business_id", businessId)
    .gte("exception_date", startDate)
    .lt("exception_date", endDate)
    .order("exception_date");

  return (data ?? []).map((e) => ({
    id: e.id,
    exceptionDate: e.exception_date,
    isClosed: e.is_closed,
    opensAt: e.opens_at,
    closesAt: e.closes_at,
    reason: e.reason,
  }));
}

const exceptionSchema = z.object({
  exceptionDate: z.string(),
  isClosed: z.boolean(),
  opensAt: z.string().nullable(),
  closesAt: z.string().nullable(),
  reason: z.string().nullable(),
});

export async function upsertException(
  businessId: string,
  data: z.infer<typeof exceptionSchema>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const parsed = exceptionSchema.parse(data);
    const service = createServiceClient();

    const { error } = await service
      .from("availability_exceptions")
      .upsert(
        {
          business_id: businessId,
          exception_date: parsed.exceptionDate,
          is_closed: parsed.isClosed,
          opens_at: parsed.isClosed ? null : parsed.opensAt,
          closes_at: parsed.isClosed ? null : parsed.closesAt,
          reason: parsed.reason || null,
        },
        { onConflict: "business_id,exception_date" },
      );

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}/availability`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteException(
  businessId: string,
  exceptionDate: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const service = createServiceClient();

    const { error } = await service
      .from("availability_exceptions")
      .delete()
      .eq("business_id", businessId)
      .eq("exception_date", exceptionDate);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}/availability`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
