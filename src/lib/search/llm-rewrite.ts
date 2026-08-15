import { getAIProvider, hasAIProvider } from "@/lib/ai/provider";

const rewriteCache = new Map<string, string | null>();
const MAX_CACHE = 200;

function normalizeKey(query: string): string {
  return query
    .replace(/[’']/g, "'")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Uses the configured LLM to rewrite a natural-language search query into a
 * short keyword phrase, e.g. "I'd love a trim and a shave this week" → "hair cut beard trim".
 *
 * Per Doc 05 §66 ("Don't call an LLM for every search") this is invoked ONLY
 * when local interpretation returned no results, and the result is memoized per
 * normalized query so a repeat query never touches the LLM again.
 */
export async function rewriteSearchQuery(query: string): Promise<string | null> {
  const key = normalizeKey(query);

  if (rewriteCache.has(key)) {
    return rewriteCache.get(key) ?? null;
  }

  if (!hasAIProvider() || !key) {
    rewriteCache.set(key, null);
    return null;
  }

  try {
    const provider = getAIProvider();
    const completion = await provider.generateReply([
      {
        role: "system",
        content:
          "You are a search-query rewriter for a local-services directory. " +
          "Rewrite the user's natural-language request into 2-5 lowercase " +
          "business/service/category keywords (no punctuation). " +
          "Only return the keywords.",
      },
      { role: "user", content: key },
    ]);

    const content = completion.content?.trim() ?? "";
    const rewritten = content.replace(/[.,]/g, " ");
    rewriteCache.set(key, rewritten || null);
    if (rewriteCache.size > MAX_CACHE) {
      const oldestKey = rewriteCache.keys().next().value;
      if (oldestKey) rewriteCache.delete(oldestKey);
    }
    return rewritten || null;
  } catch {
    rewriteCache.set(key, null);
    return null;
  }
}
