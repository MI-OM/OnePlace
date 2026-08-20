/**
 * Search query interpretation for OnePlace.
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

/**
 * A customer intent expressed in natural language. When a query is recognized
 * as a single service/category intent, we search with the canonical term(s)
 * only — ignoring pricing, timing, and location qualifiers — so phrases like
 * "I have an event next week and need affordable planner near me" don't match
 * unrelated businesses (Doc 05 §66 / §67, Doc 14 §50 "Search is the AI
 * interface"). This is a deterministic keyword match (no per-search LLM).
 *
 * `terms` is empty when the query is NOT recognized as a single intent.
 * `categoryHint` is an ILIKE pattern that matches the target category name
 * (e.g. "house cleaning", "hair salon"). Used to retrieve by category first
 * so text-matching false positives ("Cleanse" in a spa service) never surface.
 */
export type Intent = {
  terms: string[];
  categoryHint?: string;
};

/**
 * Maps common customer phrasing to canonical service/category terms anchored in
 * the real vocabulary of the platform (categories: Beauty & Hair, Hair Salon,
 * Barber Shop, Nails & Beauty, Day Spa, Massage Therapy, Health & Wellness,
 * Home & Living, House Cleaning, Home Repair, Fitness & Gym).
 *
 * `categoryHint` is an ILIKE pattern used to look up the matching category in
 * the DB. We filter by category first, then fall back to text search only when
 * no businesses exist in that category. This prevents ILIKE false positives
 * like "Cleanse" (a spa term) matching a "clean" (janitorial) search.
 *
 * Each entry wins on its pattern only; ordering is most specific first so a
 * more specific service (e.g. "manicure") takes priority over a broad one.
 */
const INTENT_PATTERNS: ReadonlyArray<{ test: RegExp; terms: string[]; categoryHint?: string }> = [
  // ── Body-part / beauty services first ──────────────────────────────────
  // These are checked BEFORE broad action verbs ("clean", "fix") so that
  // "clean my face" maps to Day Spa, not House Cleaning.  The key insight:
  // the *object* of the verb disambiguates intent — "face" → spa, "house" →
  // cleaning, "car" → no category (text fallback).
  { test: /\b(manucure|manicure|nail\s*(polish|fails|art|tech)|\bnail\b|gel\s+nail)\b/i, terms: ["nails"], categoryHint: "nail" },
  { test: /\b(hair|hairs|haircut|hairstylist|hairdresser|hairoist|bob|balayage|highlights|highlight|color|colour|cut|trim|fades|fade|taper|undercut|buzz)\b/i, terms: ["hair"], categoryHint: "hair" },
  { test: /\b(barber)\b/i, terms: ["barber"], categoryHint: "barber" },
  { test: /\b(massag(e|ing|age)|massagist|massage\s*therapy|deep\s+tissue|hot\s+stone|aromatherapy)\b/i, terms: ["massage"], categoryHint: "massage" },
  // Spa / skincare / body treatments. Includes body parts ("face", "skin",
  // "body") and treatment verbs ("wax", "scrub", "exfoliate", "peel") so
  // that queries like "clean my face", "wax my legs", "scrub my skin" map
  // to Day Spa rather than House Cleaning or Home Repair.
  { test: /\b(spa|day\s*sp|facials?|wax(?:ing|ed)?|skin|skins|faces?|bod(?:y|ies)|peel|scrub(?:s|bing)?|exfoliat(?:e|ing|ion)|tint(?:ing|ed)?|lash(?:es)?|brow(?:s)?|sauna|steam(?:ing)?|wrap(?:s)?|polish(?:ing)?|glo(?:w|wing))\b/i, terms: ["spa"], categoryHint: "day spa" },
  // ── Broad action verbs (after body-part disambiguation) ────────────────
  { test: /\b(clean(?:ing|er|ers)?|housekeeping|vacu?um|dust(?:ing|ed)?|mop(?:ping|ped)?|maid|janitor|move\s*out|deep\s*clean|office\s*clean|post\s*construction)\b/i, terms: ["clean"], categoryHint: "house cleaning" },
  { test: /\b(repair|plumb(?:ing|er)?|electrician|handyman|carpenter|paint(?:er|ing)|roof(?:ing)?|furniture|appliance|leak|broken|fix|installation|tile|carpet)\b/i, terms: ["repair"], categoryHint: "home repair" },
  { test: /\b(gym|fitness|workout|trainer|personal\s*trainer|weights|cardio|treadmill|recreation)\b/i, terms: ["fitness"], categoryHint: "fitness" },
  // Event + party planning. We return several synonymous canonical terms so
  // the search matches however the future category/service is named — e.g. an
  // "Event Planning" category (contains "planning"), a "Wedding Planner"
  // service (contains "planner"/"wedding"), or a "Catering" service. The SQL
  // OR-fallback matches ANY of these terms, so new categories like these can
  // be added in the DB without touching this code.
  { test: /\b(wedding|marriage|engagement|anniversary|birthday|party|event|cebration|cater(?:ing|er)?|reception|venue|dj|entertainment|planner|planning)\b/i, terms: ["planner", "planning", "event", "wedding", "catering"] },
  { test: /\b(health|nutrition|diet|physical\s*therapy|chiropractor|osteopath)\b/i, terms: ["wellness"], categoryHint: "health" },
];

/** Returns canonical terms for a single service/category intent, or `{}`. */
export function classifyIntent(query: string): Intent {
  if (!query) return { terms: [] };
  for (const { test, terms, categoryHint } of INTENT_PATTERNS) {
    if (test.test(query)) {
      return { terms, categoryHint };
    }
  }
  return { terms: [] };
}

