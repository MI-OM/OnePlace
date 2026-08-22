/**
 * Business embedding generation for semantic search.
 *
 * Each business is embedded as a composite document built from ALL
 * searchable fields — name, description, categories, services, location,
 * and knowledge items. This ensures the vector captures the full context
 * of what the business does, not just keywords.
 *
 * Uses OpenAI text-embedding-3-small (1536 dimensions).
 * Cost: ~$0.00002 per business embedding (~$0.02 for 1000 businesses).
 */

import { createServiceClient } from "@/lib/supabase/service";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMS = 1536;
const OPENAI_ENDPOINT = "https://api.openai.com/v1/embeddings";

/**
 * Build a rich text document from a business's full profile.
 * This is what gets embedded — the more context, the better the search.
 */
function buildBusinessDocument(business: {
  name: string;
  description: string | null;
  city: string | null;
  province: string | null;
  categories: string[];
  services: { name: string; description: string | null }[];
  knowledgeItems: string[];
}): string {
  const parts: string[] = [];

  parts.push(`Business: ${business.name}`);

  if (business.description) {
    parts.push(`Description: ${business.description}`);
  }

  if (business.categories.length > 0) {
    parts.push(`Categories: ${business.categories.join(", ")}`);
  }

  if (business.services.length > 0) {
    const svcText = business.services
      .map((s) => {
        let t = s.name;
        if (s.description) t += ` — ${s.description}`;
        return t;
      })
      .join("; ");
    parts.push(`Services: ${svcText}`);
  }

  const location = [business.city, business.province].filter(Boolean).join(", ");
  if (location) {
    parts.push(`Location: ${location}`);
  }

  if (business.knowledgeItems.length > 0) {
    parts.push(`Details: ${business.knowledgeItems.slice(0, 10).join("; ")}`);
  }

  return parts.join("\n");
}

/**
 * Generate an embedding vector for a text string using OpenAI.
 */
async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set — cannot generate embeddings");
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI embedding failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    data: { embedding: number[] }[];
  };

  return data.data[0].embedding;
}

/**
 * Generate embedding for a single business and store it.
 * Call this after onboarding or when a business profile changes.
 */
export async function embedBusiness(businessId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const service = createServiceClient();

    // Load business
    const { data: business } = await service
      .from("businesses")
      .select("id, name, description, city, province")
      .eq("id", businessId)
      .maybeSingle();

    if (!business) return { ok: false, error: "Business not found" };

    // Load categories
    const { data: catLinks } = await service
      .from("business_categories")
      .select("category:categories(name)")
      .eq("business_id", businessId);

    const categories = (catLinks ?? [])
      .map((l) => {
        const cat = Array.isArray(l.category) ? l.category[0] : l.category;
        return cat?.name ?? "";
      })
      .filter(Boolean);

    // Load services
    const { data: svcRows } = await service
      .from("business_services")
      .select("name, description")
      .eq("business_id", businessId)
      .eq("is_active", true);

    const services = (svcRows ?? []).map((s) => ({
      name: s.name,
      description: s.description,
    }));

    // Load knowledge items
    const { data: knowledgeRows } = await service
      .from("ai_knowledge_items")
      .select("content")
      .eq("business_id", businessId)
      .order("priority", { ascending: false })
      .limit(15);

    const knowledgeItems = (knowledgeRows ?? [])
      .map((k) => k.content)
      .filter(Boolean);

    // Build document and embed
    const document = buildBusinessDocument({
      name: business.name,
      description: business.description,
      city: business.city,
      province: business.province,
      categories,
      services,
      knowledgeItems,
    });

    if (!document.trim()) {
      return { ok: false, error: "Empty document — nothing to embed" };
    }

    const embedding = await embedText(document);

    // Store embedding
    const { error } = await service
      .from("businesses")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", businessId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Embed a search query string. Used at search time to generate
 * the query vector for hybrid search.
 */
export async function embedQuery(query: string): Promise<number[] | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return await embedText(query);
  } catch {
    return null;
  }
}

/**
 * Batch-embed all active businesses. Run once after migration,
 * then incrementally on business create/update.
 */
export async function embedAllBusinesses(): Promise<{ embedded: number; errors: number }> {
  const service = createServiceClient();

  const { data: businesses } = await service
    .from("businesses")
    .select("id")
    .eq("status", "active")
    .is("deleted_at", null);

  if (!businesses || businesses.length === 0) {
    return { embedded: 0, errors: 0 };
  }

  let embedded = 0;
  let errors = 0;

  for (const b of businesses) {
    const result = await embedBusiness(b.id);
    if (result.ok) {
      embedded++;
    } else {
      console.error(`Failed to embed business ${b.id}:`, result.error);
      errors++;
    }
  }

  return { embedded, errors };
}
