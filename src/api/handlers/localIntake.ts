import { parseINR } from '../../engine/money';
import type { Intake } from '../../schemas';

/** Months in the order used to turn a textual month into its number. */
const MONTH_PREFIXES = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

/** Fallback event horizon when no date can be found in free text. */
const DEFAULT_EVENT_LEAD_MONTHS = 4;
/** Smallest rupee amount we accept as a plausible total budget. */
const MIN_PLAUSIBLE_BUDGET = 1000;
/** Guest count used when none can be detected. */
const DEFAULT_GUESTS = 150;
/** Budget defaults (rupees) by occasion when none can be detected. */
const DEFAULT_BUDGET_BY_OCCASION: Record<Intake['occasion'], number> = {
  kids_birthday: 60_000,
  community: 300_000,
  milestone: 500_000,
  wedding: 1_500_000,
};
/** Max characters of the free text echoed back as the vibe. */
const VIBE_MAX_CHARS = 150;

/** Join year/month/day parts into zero-padded YYYY-MM-DD. */
function isoFromParts(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/** Normalise common date spellings (DD/MM/YYYY, YYYY/MM/DD, ISO) to YYYY-MM-DD, or null. */
export function normalizeDateString(dateStr: unknown): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const s = dateStr.trim();
  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const [, d1, m1, y1] = /^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})$/.exec(s) ?? [];
  if (d1 && m1 && y1) return isoFromParts(y1, m1, d1);

  // YYYY/MM/DD
  return yearFirstDate(s);
}

/** YYYY/MM/DD (or - / .) to YYYY-MM-DD, or null. */
function yearFirstDate(s: string): string | null {
  const [, y, m, d] = /^(\d{4})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{1,2})$/.exec(s) ?? [];
  return y && m && d ? isoFromParts(y, m, d) : null;
}

/** Date written as "15th Jan 2027" / "15 January 2027", or null. */
function textualMonthDate(text: string): string | null {
  const [, day, monthName, year] =
    /(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})/i.exec(
      text,
    ) ?? [];
  if (!day || !monthName || !year) return null;
  const monthPart = monthName.toLowerCase();
  const mIdx = MONTH_PREFIXES.findIndex((m) => monthPart.startsWith(m));
  return mIdx >= 0 ? isoFromParts(year, String(mIdx + 1), day) : null;
}

/** Best-effort event date (YYYY-MM-DD) from free text; defaults to a few months ahead. */
function extractDateFromText(text: string): string {
  // 1. DD/MM/YYYY or DD-MM-YYYY (e.g. "on 15 /01/2027", "15/01/2027", "15-01-2027")
  const [, d, m, y] = /(?:on\s+)?(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})/i.exec(text) ?? [];
  if (d && m && y) return isoFromParts(y, m, d);

  // 2. Textual month, e.g. "15th Jan 2027"
  const textual = textualMonthDate(text);
  if (textual) return textual;

  // 3. Standard YYYY-MM-DD
  const ymd = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (ymd) return ymd[0];

  // Default to 4 months in future
  const future = new Date();
  future.setMonth(future.getMonth() + DEFAULT_EVENT_LEAD_MONTHS);
  return future.toISOString().slice(0, 10);
}

/** Amount captured by the first group of \`pattern\` (or the whole match), if plausible as a budget. */
function plausibleBudget(pattern: RegExp, text: string, useWholeMatch = false): number | null {
  const match = pattern.exec(text);
  const raw = useWholeMatch ? match?.[0] : match?.[1];
  const found = raw ? parseINR(raw) : null;
  return found && found >= MIN_PLAUSIBLE_BUDGET ? found : null;
}

/** Budget (rupees) from explicit phrases, unit amounts or rupee symbols; occasion default otherwise. */
function extractBudgetFromText(text: string, occasion: Intake['occasion']): number {
  return (
    // 1. Explicit budget phrase: "budget is 50000", "budget: 50,000", "cost around 15 lakh"
    plausibleBudget(
      /(?:budget|cost|total|amount|kharcha)\s*(?:is|of|around|approx|approx\.|:|=)?\s*([₹\d,.]+\s*(?:lakhs?|lacs?|l\b|crores?|cr\b|k\b|thousands?)?)/i,
      text,
    ) ??
    // 2. Unit match with strict word boundary (so "2027 kids" does NOT match "2027 k")
    plausibleBudget(/([0-9.]+)\s*(?:lakhs?|lacs?|l\b|crores?|cr\b|k\b|thousands?)/i, text, true) ??
    // 3. Rupee symbol: "₹50,000" or "Rs. 75000"
    plausibleBudget(/(?:₹|rs\.?)\s*([\d,.]+)/i, text) ??
    DEFAULT_BUDGET_BY_OCCASION[occasion]
  );
}

/** First positive integer captured by \`pattern\`, or null. */
function positiveCount(pattern: RegExp, text: string): number | null {
  const raw = pattern.exec(text)?.[1];
  const num = raw ? parseInt(raw, 10) : NaN;
  return !Number.isNaN(num) && num > 0 ? num : null;
}

/** Headcount from phrases such as "150 guests", "200 pax" or "120 plates"; default otherwise. */
function extractGuestsFromText(text: string): number {
  const lower = text.toLowerCase();
  // Handles "150 guest", "150 guests", "200 pax", "80 people", "100 mehmaan", "50 kids"
  return (
    positiveCount(
      /(?:around|approx|approx\.)?\s*(\d+)\s*(?:guests?|people|pax|persons?|log|mehmaan|kids?|children|attendees?)\b/i,
      lower,
    ) ??
    positiveCount(/(\d+)\s*(?:headcount|seats|plates)/i, lower) ??
    DEFAULT_GUESTS
  );
}

/** True when \`lower\` contains at least one keyword. */
function hasAny(lower: string, keywords: readonly string[]): boolean {
  return keywords.some((k) => lower.includes(k));
}

/** Occasion keyword rules, checked in order; weddings are the fallback. */
const OCCASION_KEYWORDS: readonly { occasion: Intake['occasion']; keywords: string[] }[] = [
  {
    occasion: 'kids_birthday',
    keywords: ['birthday', 'bday', 'kids party', 'kid', 'child', 'turning'],
  },
  {
    occasion: 'milestone',
    keywords: ['milestone', 'anniversary', '50th', '60th', 'jubilee', 'retirement'],
  },
  {
    occasion: 'community',
    keywords: ['community', 'festival', 'diwali', 'puja', 'pooja', 'ganesh', 'navratri', 'society'],
  },
];

function extractOccasionFromText(text: string): Intake['occasion'] {
  const lower = text.toLowerCase();
  return OCCASION_KEYWORDS.find((r) => hasAny(lower, r.keywords))?.occasion ?? 'wedding';
}

/** City rules, checked in order: every \`all\` keyword and at least one \`any\` keyword must match. */
const CITY_RULES: readonly { all?: string[]; any?: string[]; city: string }[] = [
  { all: ['mayur vihar', 'delhi'], city: 'New Delhi (Mayur Vihar)' },
  { all: ['dwarka', 'delhi'], city: 'New Delhi (Dwarka)' },
  { all: ['rohini', 'delhi'], city: 'New Delhi (Rohini)' },
  { all: ['south delhi'], city: 'South Delhi' },
  { all: ['new delhi'], city: 'New Delhi' },
  { all: ['delhi'], city: 'Delhi' },
  { all: ['noida'], city: 'Noida' },
  { any: ['gurgaon', 'gurugram'], city: 'Gurugram' },
  { all: ['kothrud', 'pune'], city: 'Pune (Kothrud)' },
  { all: ['baner', 'pune'], city: 'Pune (Baner)' },
  { all: ['pune'], city: 'Pune' },
  { all: ['bandra', 'mumbai'], city: 'Mumbai (Bandra)' },
  { all: ['juhu', 'mumbai'], city: 'Mumbai (Juhu)' },
  { all: ['mumbai'], city: 'Mumbai' },
  { any: ['bangalore', 'bengaluru'], city: 'Bengaluru' },
  { all: ['hyderabad'], city: 'Hyderabad' },
  { all: ['jaipur'], city: 'Jaipur' },
  { all: ['udaipur'], city: 'Udaipur' },
  { all: ['ahmedabad'], city: 'Ahmedabad' },
  { all: ['chandigarh'], city: 'Chandigarh' },
  { all: ['lucknow'], city: 'Lucknow' },
  { all: ['goa'], city: 'Goa' },
  { all: ['kolkata'], city: 'Kolkata' },
  { all: ['chennai'], city: 'Chennai' },
];

function extractCityFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  return CITY_RULES.find(
    (r) => (r.all ?? []).every((k) => lower.includes(k)) && (!r.any || hasAny(lower, r.any)),
  )?.city;
}

/** Priority keyword rules; matched priorities keep this order. */
const PRIORITY_KEYWORDS: readonly { priority: Intake['priorities'][number]; keywords: string[] }[] =
  [
    { priority: 'decor', keywords: ['decor', 'theme', 'flower', 'balloon', 'mandap'] },
    {
      priority: 'entertainment',
      keywords: ['dj', 'music', 'dance', 'sangeet', 'game', 'magic', 'entertain', 'party'],
    },
    {
      priority: 'catering',
      keywords: ['food', 'cater', 'menu', 'snack', 'cake', 'chaat', 'feast'],
    },
    { priority: 'photography', keywords: ['photo', 'shoot', 'film', 'candid', 'cinemat'] },
    {
      priority: 'venue',
      keywords: ['venue', 'lawn', 'hall', 'resort', 'banquet', 'play zone'],
    },
  ];

/** Priorities used when the text mentions none, by occasion. */
const DEFAULT_PRIORITIES: Record<Intake['occasion'], Intake['priorities']> = {
  kids_birthday: ['decor', 'entertainment', 'catering'],
  milestone: ['catering', 'photography', 'entertainment'],
  community: ['catering', 'venue', 'entertainment'],
  wedding: ['catering', 'venue', 'photography'],
};

function extractPrioritiesFromText(
  text: string,
  occasion: Intake['occasion'],
): Intake['priorities'] {
  const lower = text.toLowerCase();
  const priorities = PRIORITY_KEYWORDS.filter((r) => hasAny(lower, r.keywords)).map(
    (r) => r.priority,
  );
  return priorities.length > 0 ? priorities : DEFAULT_PRIORITIES[occasion];
}

/** Deterministic, offline parser used when Gemini is unavailable or returns invalid output. */
export function localParseIntake(text: string): Intake {
  const occasion = extractOccasionFromText(text);
  return {
    occasion,
    totalBudget: extractBudgetFromText(text, occasion),
    guests: extractGuestsFromText(text),
    eventDate: extractDateFromText(text),
    vibe: text.slice(0, VIBE_MAX_CHARS).trim(),
    city: extractCityFromText(text),
    priorities: extractPrioritiesFromText(text, occasion),
  };
}
