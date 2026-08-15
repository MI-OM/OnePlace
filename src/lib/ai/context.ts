import { DAY_LABELS, formatTime, priceLabel } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/service";

export type BusinessContext = {
  name: string;
  personality: string | null;
  greeting: string | null;
  aiEnabled: boolean;
  context: string;
};

/**
 * Loads grounded business information for the AI (Doc 14 §15, §107).
 * Uses the service-role client so knowledge items (which are member-only
 * under RLS) are readable server-side and never exposed to the customer.
 */
export async function loadBusinessContext(
  businessId: string,
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
        .select("enabled, greeting, personality, handoff_enabled, escalation_enabled")
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
    lines.push(`Business policies and knowledge:`);
    for (const item of knowledge) {
      lines.push(`  - ${item.title}: ${item.content}`);
    }
  }

  return {
    name: business.name,
    personality: config?.personality ?? null,
    greeting: config?.greeting ?? null,
    aiEnabled: config?.enabled ?? true,
    context: lines.join("\n"),
  };
}
