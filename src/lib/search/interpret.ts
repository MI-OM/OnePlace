/**
 * Search query interpretation for OnePlace.
 *
 * Customers search naturally ("I want to have a massage", "Do you clean
 * houses?", "I need somewhere to get my hair done this Saturday"). The search
 * bar should understand the *intent*, not match the literal sentence against
 * the database.
 *
 * We extract content words by stripping filler/stop-words, expand synonyms,
 * and pass the cleaned phrase to the ranking function. This is deterministic
 * and cheap (no LLM) so it can run on every keystroke.
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
    off up down out about above after before between through during
  `
    .trim()
    .split(/\s+/)
    .filter(Boolean),
);

const FILLER_PHRASES: ReadonlyArray<RegExp> = [
  /^(i\s+)?(want to have a|want a|want to|i'd like |i would like |i'm looking for|i am looking for|i'm after|i need|i would need|looking for|need (a|an|some)|would love |want to book|trying to (find|book|get|schedule))\b/i,
  /\b(i want to have a|i want a|i want to|i'd like|i would like|do you|can you|could you|where can i|where is|where to|looking for|i'm looking for|i am looking for)\b/gi,
  /\b(done|ready|available|when|today|tomorrow|now|soon|please|thx|thanks)\b/gi,
];

function cleanToken(token: string): string {
  return token.replace(/[^a-z0-9+#-]+/gi, "").replace(/^[+#]+|[+#]+$/g, "");
}

// ---------------------------------------------------------------------------
// Synonym expansion — maps common customer terms to canonical DB terms
// ---------------------------------------------------------------------------
const SYNONYMS: Record<string, string[]> = {
  // Hair & beauty
  hairdresser: ["hair", "salon"],
  stylist: ["hair", "salon"],
  "hair stylist": ["hair", "salon"],
  cut: ["hair"],
  trim: ["hair"],
  color: ["hair"],
  highlights: ["hair"],
  balayage: ["hair"],
  bob: ["hair"],
  fades: ["barber"],
  fade: ["barber"],
  taper: ["barber"],
  undercut: ["barber"],
  buzz: ["barber"],
  beard: ["barber"],
  shave: ["barber"],
  manicure: ["nails"],
  pedicure: ["nails"],
  "nail art": ["nails"],
  "gel nails": ["nails"],
  "acrylic nails": ["nails"],
  "deep tissue": ["massage"],
  "hot stone": ["massage"],
  aromatherapy: ["massage"],
  reflexology: ["massage"],
  facial: ["spa"],
  waxing: ["spa"],
  wax: ["spa"],
  scrub: ["spa"],
  sauna: ["spa"],
  wrap: ["spa"],
  peel: ["spa"],
  // Cleaning & repair
  housekeeper: ["clean", "cleaning"],
  maid: ["clean", "cleaning"],
  janitor: ["clean", "cleaning"],
  "deep clean": ["clean", "cleaning"],
  "move out": ["clean", "cleaning"],
  "office clean": ["clean", "cleaning"],
  plumber: ["repair"],
  electrician: ["repair"],
  handyman: ["repair"],
  carpenter: ["repair"],
  painter: ["repair"],
  roofer: ["repair"],
  // Fitness & events
  trainer: ["fitness"],
  gym: ["fitness"],
  workout: ["fitness"],
  weights: ["fitness"],
  wedding: ["planner", "event"],
  dj: ["planner", "event"],
  caterer: ["planner", "event"],
  catering: ["planner", "event"],
  venue: ["planner", "event"],
  // Health & wellness
  chiropractor: ["wellness"],
  physio: ["wellness"],
  therapist: ["wellness", "coaching"],
  counseling: ["coaching", "wellness"],
  counselor: ["coaching", "wellness"],
  coach: ["coaching", "counseling"],
  mentor: ["coaching"],
  // Pets
  vet: ["veterinary", "pet"],
  veterinarian: ["veterinary", "pet"],
  "pet groomer": ["pet", "grooming"],
  grooming: ["pet", "grooming"],
  // Food & drink
  bakery: ["bakery", "food"],
  coffee: ["cafe", "coffee"],
  cafe: ["cafe", "coffee"],
  restaurant: ["restaurant", "food"],
  // Transport
  taxi: ["transport", "taxi"],
  uber: ["transport", "taxi"],
  // Photo & education
  photography: ["photography", "photo"],
  photographer: ["photography", "photo"],
  tutoring: ["tutoring", "education"],
  tutor: ["tutoring", "education"],
  // Legal & accounting
  lawyer: ["legal"],
  attorney: ["legal"],
  accountant: ["accounting"],
  bookkeeper: ["accounting"],
  // Community services & housing
  accommodation: ["housing", "shelter", "supportive housing"],
  shelter: ["housing", "accommodation", "community services", "supportive housing"],
  homeless: ["shelter", "housing", "community services", "supportive housing"],
  housing: ["shelter", "accommodation", "supportive housing"],
  lodging: ["housing", "accommodation"],
  "food bank": ["food bank", "community services", "food"],
  foodbank: ["food bank", "community services", "food"],
  eviction: ["housing", "community services", "supportive housing"],
  // Automotive
  mechanic: ["automotive", "car repair"],
  auto: ["automotive", "car repair"],
  automotive: ["automotive", "car repair"],
  "car repair": ["automotive", "car repair"],
  oil: ["automotive"],
  tire: ["automotive"],
  // Real estate
  realtor: ["real estate", "property"],
  "real estate": ["real estate", "property"],
  apartment: ["real estate", "property"],
  rent: ["real estate", "property"],
  mortgage: ["real estate", "property"],
  // Childcare & senior care
  babysitter: ["childcare", "child"],
  daycare: ["childcare", "child"],
  childcare: ["childcare", "child"],
  children: ["childcare", "child"],
  elderly: ["senior care", "elderly"],
  senior: ["senior care", "elderly"],
  nursing: ["senior care", "health"],
  // IT & tech
  computer: ["tech", "IT"],
  laptop: ["tech", "IT"],
  "it support": ["tech", "IT"],
  website: ["tech", "IT"],
  software: ["tech", "IT"],
  // Moving
  mover: ["moving", "relocation"],
  moving: ["moving", "relocation"],
  relocation: ["moving", "relocation"],
  // Music & arts
  "music lessons": ["music", "arts"],
  piano: ["music", "arts"],
  guitar: ["music", "arts"],
  art: ["art", "arts"],
  painting: ["art", "arts"],
  craft: ["art", "arts"],
};

/**
 * Expand query terms using the synonym map. Returns additional terms
 * to include in the search.
 */
export function expandSynonyms(terms: string[]): string[] {
  const expanded: string[] = [];
  for (const term of terms) {
    const syns = SYNONYMS[term.toLowerCase()];
    if (syns) expanded.push(...syns);
  }
  return [...new Set(expanded)];
}

/**
 * Reduces a natural-language search query to its content-bearing terms.
 * Falls back to the original (trimmed) query when no content words survive.
 */
export function interpretQuery(query: string): string {
  if (!query) return "";

  let normalized = query
    .replace(/['']/g, "'")
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
 * Includes synonym expansion.
 */
export function interpretQueryTerms(query: string, max = 4): string[] {
  const rawTerms: string[] = [];
  const seen = new Set<string>();
  for (const token of interpretQuery(query).split(/\s+/)) {
    if (token && !seen.has(token)) {
      seen.add(token);
      rawTerms.push(token);
      if (rawTerms.length >= max) break;
    }
  }

  // Add synonym-expanded terms
  const synonyms = expandSynonyms(rawTerms);
  for (const syn of synonyms) {
    if (!seen.has(syn)) {
      seen.add(syn);
      rawTerms.push(syn);
    }
  }

  return rawTerms.slice(0, max + 2); // Allow a couple extra from synonyms
}

// ---------------------------------------------------------------------------
// Intent classification
// ---------------------------------------------------------------------------

export type Intent = {
  terms: string[];
  categoryHint?: string;
};

/**
 * Maps common customer phrasing to canonical service/category terms.
 * When a query matches a known pattern, we search with the canonical term(s)
 * and optionally a categoryHint that maps to the real DB category name.
 *
 * `categoryHint` is an ILIKE pattern used to look up the matching category.
 * We filter by category first, then fall back to text search.
 */
const INTENT_PATTERNS: ReadonlyArray<{ test: RegExp; terms: string[]; categoryHint?: string }> = [
  // ── Community services & housing (check FIRST — highest urgency queries) ──
  { test: /\b(accommodation|shelter|homeless|housing|lodging|eviction|food\s*bank|foodbank|soup\s*kitchen|community\s*meals|supportive|social\s*services|outreach|charity|nonprofit|non-profit|donation|volunteer)\b/i, terms: ["community services", "shelter", "housing"], categoryHint: "community" },
  // Body-part / beauty services
  { test: /\b(manucure|manicure|nail\s*(polish|fails|art|tech)|\bnail\b|gel\s+nail)\b/i, terms: ["nails"], categoryHint: "nail" },
  { test: /\b(hair|hairs|haircut|hairstylist|hairdresser|hairoist|bob|balayage|highlights|highlight|color|colour|cut|trim|fades|fade|taper|undercut|buzz)\b/i, terms: ["hair"], categoryHint: "hair" },
  { test: /\b(barber)\b/i, terms: ["barber"], categoryHint: "barber" },
  { test: /\b(massag(e|ing|age)|massagist|massage\s*therapy|deep\s+tissue|hot\s+stone|aromatherapy)\b/i, terms: ["massage"], categoryHint: "massage" },
  { test: /\b(spa|day\s*sp|facials?|wax(?:ing|ed)?|skin|skins|faces?|bod(?:y|ies)|peel|scrub(?:s|bing)?|exfoliat(?:e|ing|ion)|tint(?:ing|ed)?|lash(?:es)?|brow(?:s)?|sauna|steam(?:ing)?|wrap(?:s)?|polish(?:ing)?|glo(?:w|wing))\b/i, terms: ["spa"], categoryHint: "day spa" },
  // Broad action verbs
  { test: /\b(clean(?:ing|er|ers)?|housekeeping|vacu?um|dust(?:ing|ed)?|mop(?:ping|ped)?|maid|janitor|move\s*out|deep\s*clean|office\s*clean|post\s*construction)\b/i, terms: ["clean"], categoryHint: "house cleaning" },
  { test: /\b(repair|plumb(?:ing|er)?|electrician|handyman|carpenter|paint(?:er|ing)|roof(?:ing)?|furniture|appliance|leak|broken|fix|installation|tile|carpet)\b/i, terms: ["repair"], categoryHint: "home repair" },
  { test: /\b(gym|fitness|workout|trainer|personal\s*trainer|weights|cardio|treadmill|recreation)\b/i, terms: ["fitness"], categoryHint: "fitness" },
  { test: /\b(wedding|marriage|engagement|anniversary|birthday|party|event|cebration|cater(?:ing|er)?|reception|venue|dj|entertainment|planner|planning)\b/i, terms: ["planner", "planning", "event", "wedding", "catering"] },
  { test: /\b(health|nutrition|diet|physical\s*therapy|chiropractor|osteopath)\b/i, terms: ["wellness"], categoryHint: "health" },
  { test: /\b(coach|coaching|counsel(?:ing|or)?|therapist|ment(?:or|oring))\b/i, terms: ["coaching", "counseling"] },
  // Auto-generated patterns from seed data categories
  { test: /\b(pet|dog|cat|animal|groom(?:ing)?)\b/i, terms: ["pet", "grooming"], categoryHint: "pet" },
  { test: /\b(photo|photograph|camera|portrait|headshot)\b/i, terms: ["photography", "photo"], categoryHint: "photo" },
  { test: /\b(tutor|teach|lesson|learn|education|school)\b/i, terms: ["tutoring", "education"], categoryHint: "tutor" },
  { test: /\b(bakery|bak|bread|cake|pastry|dessert)\b/i, terms: ["bakery"], categoryHint: "bakery" },
  { test: /\b(coffee|cafe|espresso|latte|drink)\b/i, terms: ["cafe", "coffee"], categoryHint: "cafe" },
  { test: /\b(restaurant|dine|dinner|lunch|food|eat|meal)\b/i, terms: ["restaurant", "food"], categoryHint: "restaurant" },
  { test: /\b(lawyer|attorney|legal|solicitor|notary)\b/i, terms: ["legal"], categoryHint: "legal" },
  { test: /\b(account(?:ant|ing)|bookkeep|tax|financ)\b/i, terms: ["accounting"], categoryHint: "account" },
  { test: /\b(transport|taxi|shuttle|ride|car\s*service)\b/i, terms: ["transport", "taxi"], categoryHint: "transport" },
  // Additional categories — covers future businesses
  { test: /\b(mechanic|auto|automotive|car\s*repair|oil\s*change|tire|brake|engine|transmission)\b/i, terms: ["automotive", "car repair"], categoryHint: "auto" },
  { test: /\b(realtor|real\s*estate|apartment|rent|mortgage|property|house\s*for\s*sale|condo)\b/i, terms: ["real estate", "property"], categoryHint: "real estate" },
  { test: /\b(babysitter|daycare|childcare|child|children|kid|nanny|after\s*school)\b/i, terms: ["childcare", "child"], categoryHint: "child" },
  { test: /\b(elderly|senior|nursing|retirement|assisted\s*living|aged\s*care)\b/i, terms: ["senior care", "elderly"], categoryHint: "senior" },
  { test: /\b(computer|laptop|it\s*support|website|software|tech|technology|digital)\b/i, terms: ["tech", "IT"], categoryHint: "tech" },
  { test: /\b(mover|movers|moving|relocation|storage|shipping)\b/i, terms: ["moving", "relocation"], categoryHint: "moving" },
  { test: /\b(music|piano|guitar|lesson|sing|singing|drum|violin)\b/i, terms: ["music", "arts"], categoryHint: "music" },
  { test: /\b(art|painting|craft|pottery|sculpture|gallery)\b/i, terms: ["art", "arts"], categoryHint: "art" },
];

/** Returns canonical terms for a single service/category intent, or empty. */
export function classifyIntent(query: string): Intent {
  if (!query) return { terms: [] };
  for (const { test, terms, categoryHint } of INTENT_PATTERNS) {
    if (test.test(query)) {
      return { terms, categoryHint };
    }
  }
  return { terms: [] };
}
