"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
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

const knowledgeSchema = z.object({
  title: z.string().min(1, "Title required").max(200),
  content: z.string().min(10, "Content must be at least 10 characters").max(10000),
  category: z.string().optional(),
  priority: z.number().min(0).max(10).optional(),
  sourceUrl: z.string().optional(),
});

export type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  priority: number;
  isActive: boolean;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getKnowledgeItems(
  businessId: string,
): Promise<KnowledgeItem[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("ai_knowledge_items")
    .select("id, title, content, category, priority, is_active, source_url, created_at, updated_at")
    .eq("business_id", businessId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: item.category,
    priority: item.priority,
    isActive: item.is_active,
    sourceUrl: item.source_url,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function createKnowledgeItem(
  businessId: string,
  data: z.infer<typeof knowledgeSchema>,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    await requireBusinessMember(businessId);
    const parsed = knowledgeSchema.parse(data);
    const service = createServiceClient();

    const { data: item, error } = await service
      .from("ai_knowledge_items")
      .insert({
        business_id: businessId,
        title: parsed.title,
        content: parsed.content,
        category: parsed.category || null,
        priority: parsed.priority ?? 0,
        source_url: parsed.sourceUrl || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}/knowledge`);
    return { ok: true, id: item.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateKnowledgeItem(
  businessId: string,
  itemId: string,
  data: Partial<z.infer<typeof knowledgeSchema>> & { isActive?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const service = createServiceClient();

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.content !== undefined) updates.content = data.content;
    if (data.category !== undefined) updates.category = data.category || null;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.sourceUrl !== undefined) updates.source_url = data.sourceUrl || null;
    if (data.isActive !== undefined) updates.is_active = data.isActive;

    const { error } = await service
      .from("ai_knowledge_items")
      .update(updates)
      .eq("id", itemId)
      .eq("business_id", businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}/knowledge`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteKnowledgeItem(
  businessId: string,
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireBusinessMember(businessId);
    const service = createServiceClient();

    const { error } = await service
      .from("ai_knowledge_items")
      .delete()
      .eq("id", itemId)
      .eq("business_id", businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/dashboard/${businessId}/knowledge`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
