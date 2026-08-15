/**
 * Search query interpretation for One Place.
 *
 * Customers search naturally ("I want to have a massage", "Do you clean
 * houses?", "I need somewhere to get my hair done this Saturday"). The search
 * bar should understand the *intent*, not match the literal sentence against
 * the database (Doc 05 §66 — "Don't call an LLM for every search").
 *
 * We extract the content words by stripping filler/stop-words and common
 * natural-language framing, then pass the cleaned phrase to the ranking
 * function. This is deterministic and cheap (no LLM) so it can run on every
 * keystroke in an autocomplete scenario. An optional, cached LLM rewrite is
 * used only as a last resort when local interpretation yields no results.
 */

const STOP_WORDS = new Set(
  String.raw`
    a an the and or but of to in on at for by with is are was were this that
    these those i you he she it we they them his her its our their your mine yours
    i'm ive i'll id i'd you're don't doesnt cant cannot could should would may might
    shall shant will wont
    want wanting wanted wants
    need needs needing needed
    wish like love prefer
    look looking find finding found
    get got gotten getting gonna
    need somewhere someplace anywhere somewhere some any
    someone anybody anyone anybody everyone everybody
    today tomorrow tonight now later yesterday day days week weeks weekend weekends
    monday tuesday wednesday thursday friday saturday sunday weekdays weekday
    morning afternoon evening night hours hour time when where which who what how
    does do did going to have has had having make makes made making take takes took
    please thx thanks thank you sorry
    nearby near me local location
    for service services based
    my your your mine yours our theirs theirs his hers its
    done finishing ready available booked appointment appointments schedule scheduling
    can could should would will would like would love
  `
    .trim()
    .split(/\s+/)
    .filter(Boolean),
);

// Phrases that prefix a real request — stripped before word-level filtering so
// the following content words ("hair", "massage", "clean") survive cleanly.
const FILLER_PHRASES: ReadonlyArray<RegExp> = [
  /^(i\s+)?(want to have a|want a|want to|i'd like |i would like |i'm looking for|i am looking for|i'm after|i need|i would need|looking for|need (a|an|some)|would love |want to book|trying to (find|book|get|schedule))\b/i,
  /\b(i want to have a|i want a|i want to|i'd like|i would like|do you|can you|could you|where can i|where is|where to|looking for|i'm looking for|i am looking for)\b/gi,
  /\b(done|ready|available|when|today|tomorrow|now|soon|please|thx|thanks)\b/gi,
];

function cleanToken(token: string): string {
  return token.replace(/[^a-z0-9+#-]+/gi, "").replace(/^[+#]+|[+#]+$/g, "");
}

/**
 * Reduces a natural-language search query to its content-bearing terms.
 * Falls back to the original (trimmed) query when no content words survive.
 */
export function interpretQuery(query: string): string {
  if (!query) return "";

  let normalized = query
    .replace(/[’']/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .trim();

  for (const phrase of FILLER_PHRASES) {
    normalized = normalized.replace(phrase, " ");
  }

  const tokens = normalized
    .split(/[\s,;]+/)
    .map(cleanToken)
    .map((t) => t.toLowerCase())
    .filter(
      (t) => t.length >= 2 && !STOP_WORDS.has(t),
    );

  if (tokens.length === 0) {
    return query.trim();
  }

  return tokens.join(" ");
}

/**
 * Returns up to `max` content-bearing terms, most specific first.
 */
export function interpretQueryTerms(query: string, max = 4): string[] {
  const terms: string[] = [];
  const seen = new Set<string>();
  for (const token of interpretQuery(query).split(/\s+/)) {
    if (token && !seen.has(token)) {
      seen.add(token);
      terms.push(token);
      if (terms.length >= max) break;
    }
  }
  return terms;
}
