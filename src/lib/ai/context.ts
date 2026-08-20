import { DAY_LABELS, formatTime, priceLabel } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/service";

export type BusinessContext = {
  name: string;
  personality: string | null;
  greeting: string | null;
  aiEnabled: boolean;
  preferredLanguage: string | null;
  context: string;
};

/**
 * Loads grounded business information for the AI (Doc 14 §15, §107).
 * Uses the service-role client so knowledge items (which are member-only
 * under RLS) are readable server-side and never exposed to the customer.
 *
 * When `customerMessage` is provided, knowledge items are ranked by
 * keyword relevance so only the most pertinent documents are included
 * (RAG-lite retrieval). Without a message (e.g. greeting), all active
 * items are included with a hard cap.
 */
export async function loadBusinessContext(
  businessId: string,
  customerMessage?: string,
): Promise<BusinessContext> {
  const supabase = createServiceClient();

  const [businessResult, servicesResult, hoursResult, knowledgeResult, configResult] =
    await Promise.all([
      supabase
        .from("businesses")
        .select(
          "id, name, description, phone, email, website_url, address_line_1, city, province, postal_code, timezone, verification_status",
        )
        .eq("id", businessId)
        .maybeSingle(),
      supabase
        .from("business_services")
        .select(
          "name, description, price, price_type, min_price, max_price, currency, duration_minutes",
        )
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("created_at"),
      supabase
        .from("business_hours")
        .select("day_of_week, is_closed, opens_at, closes_at")
        .eq("business_id", businessId)
        .order("day_of_week"),
      supabase
        .from("ai_knowledge_items")
        .select("title, content, category, priority")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("priority"),
      supabase
        .from("ai_configurations")
        .select("enabled, greeting, personality, handoff_enabled, escalation_enabled, preferred_language")
        .eq("business_id", businessId)
        .maybeSingle(),
    ]);

  const business = businessResult.data;
  if (!business) {
    throw new Error(`Couldn't load business context: ${businessResult.error?.message ?? "not found"}`);
  }

  const services = servicesResult.data ?? [];
  const hours = hoursResult.data ?? [];
  const knowledge = knowledgeResult.data ?? [];
  const config = configResult.data;

  const lines: string[] = [];
  lines.push(`Business name: ${business.name}`);
  if (business.description) lines.push(`Description: ${business.description}`);
  lines.push(
    `Location: ${[business.address_line_1, business.city, business.province]
      .filter(Boolean)
      .join(", ")}`,
  );
  if (business.phone) lines.push(`Phone: ${business.phone}`);
  if (business.email) lines.push(`Email: ${business.email}`);
  if (business.website_url) lines.push(`Website: ${business.website_url}`);
  lines.push(
    `Verification status: ${business.verification_status ?? "unverified"}`,
  );

  const hourLines = hours
    .map((h) => {
      if (h.is_closed) {
        return `${DAY_LABELS[h.day_of_week]}: closed`;
      }
      return `${DAY_LABELS[h.day_of_week]}: ${formatTime(h.opens_at) ?? "?"} – ${formatTime(h.closes_at) ?? "?"}`;
    })
    .filter(Boolean);

  if (hourLines.length > 0) {
    lines.push(`Hours:`, ...hourLines.map((line) => `  ${line}`));
  }

  if (services.length > 0) {
    lines.push(`Services:`);
    for (const service of services) {
      const parts = [
        service.name,
        priceLabel({
          price: service.price,
          priceType: service.price_type,
          minPrice: service.min_price,
          maxPrice: service.max_price,
          currency: service.currency,
        }),
        service.duration_minutes
          ? `${service.duration_minutes} min`
          : null,
      ].filter(Boolean);
      lines.push(`  - ${parts.join(" · ")}`);
      if (service.description) {
        lines.push(`      ${service.description}`);
      }
    }
  }

  if (knowledge.length > 0) {
    const ranked = rankKnowledge(knowledge, customerMessage);
    lines.push(`Business policies and knowledge:`);
    for (const item of ranked) {
      lines.push(`  - ${item.title}: ${item.content}`);
    }
  }

  return {
    name: business.name,
    personality: config?.personality ?? null,
    greeting: config?.greeting ?? null,
    aiEnabled: config?.enabled ?? true,
    preferredLanguage: config?.preferred_language ?? null,
    context: lines.join("\n"),
  };
}

const STOP_WORDS = new Set([
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it",
  "they", "them", "this", "that", "am", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to",
  "for", "of", "with", "by", "from", "as", "into", "about", "can",
  "could", "would", "should", "will", "may", "might", "shall",
  "not", "no", "nor", "if", "then", "else", "when", "so",
  "what", "how", "which", "who", "whom", "where", "why",
  "hi", "hello", "hey", "thanks", "please", "yes", "no",
  "just", "also", "very", "too", "really", "much", "more",
]);

/**
 * RAG-lite: ranks knowledge items by keyword overlap with the customer's
 * message. High-priority items get a small boost. Returns at most
 * MAX_KNOWLEDGE_ITEMS to avoid context overflow.
 */
function rankKnowledge(
  items: { title: string; content: string; category: string | null; priority: number }[],
  customerMessage?: string,
  maxItems = 8,
): typeof items {
  if (!customerMessage || items.length <= maxItems) {
    return items.slice(0, maxItems);
  }

  const queryTokens = extractTokens(customerMessage);

  const scored = items.map((item) => {
    const text = `${item.title} ${item.content} ${item.category ?? ""}`;
    const itemTokens = extractTokens(text);
    const itemSet = new Set(itemTokens);

    let score = 0;
    for (const token of queryTokens) {
      if (itemSet.has(token)) score++;
      // Partial match: prefix check
      for (const itemToken of itemSet) {
        if (itemToken.startsWith(token) || token.startsWith(itemToken)) {
          score += 0.5;
        }
      }
    }

    // Priority boost
    score += item.priority * 0.3;

    return { item, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map((s) => s.item);
}

function extractTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}
