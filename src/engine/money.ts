/**
 * Indian Rupee (INR) money calculation, parsing, and formatting utilities.
 * All internal money values are represented as non-negative integer rupees.
 */

/**
 * Formats rupees with Indian digit grouping.
 *
 * @param rupees - Amount in rupees (rounded to the nearest integer; NaN / Infinity yield 0).
 * @returns A string such as `₹8,00,000` (with a leading `-` for negatives).
 * @example
 * ```ts
 * formatINR(800000); // => '₹8,00,000'
 * ```
 */
export function formatINR(rupees: number): string {
  if (isNaN(rupees) || !isFinite(rupees)) return '₹0';
  const rounded = Math.round(rupees);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);

  const s = abs.toString();
  if (s.length <= 3) {
    return `${isNegative ? '-' : ''}₹${s}`;
  }

  const lastThree = s.slice(-3);
  const otherNumbers = s.slice(0, -3);
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Converts rupees into a compact Thousand / Lakh / Crore string.
 *
 * @param rupees - Amount in rupees.
 * @returns Compact text, falling back to {@link formatINR} below one thousand.
 * @example
 * ```ts
 * toLakh(850000); // => '₹8.5 Lakh'
 * toLakh(25000000); // => '₹2.5 Crore'
 * ```
 */
export function toLakh(rupees: number): string {
  const abs = Math.abs(rupees);
  if (abs >= 10_000_000) {
    const cr = (rupees / 10_000_000).toFixed(2).replace(/\.?0+$/, '');
    return `₹${cr} Crore`;
  }
  if (abs >= 100_000) {
    const lk = (rupees / 100_000).toFixed(2).replace(/\.?0+$/, '');
    return `₹${lk} Lakh`;
  }
  if (abs >= 1_000) {
    const k = (rupees / 1_000).toFixed(1).replace(/\.?0+$/, '');
    return `₹${k} Thousand`;
  }
  return formatINR(rupees);
}

/** Unit suffixes understood by {@link parseINR}: crore, lakh and thousand. */
const UNIT_PATTERNS: { pattern: RegExp; multiplier: number }[] = [
  { pattern: /^([\d.]+)\s*(?:crore|crores|cr)$/, multiplier: 10_000_000 },
  { pattern: /^([\d.]+)\s*(?:lakh|lakhs|lac|lacs|l)$/, multiplier: 100_000 },
  { pattern: /^([\d.]+)\s*(?:k|thousand|thousands)$/, multiplier: 1_000 },
];

/** Parse "<number> <unit>" text (crore / lakh / thousand); null when no unit pattern matches. */
function parseUnitAmount(text: string): number | null {
  for (const { pattern, multiplier } of UNIT_PATTERNS) {
    const raw = pattern.exec(text)?.[1];
    const val = raw ? parseFloat(raw) : NaN;
    if (!isNaN(val) && val >= 0) return Math.round(val * multiplier);
  }
  return null;
}

/**
 * Forgiving parser for user-typed amounts: "8 lakh", "8.5L", "2 cr", "₹8,00,000", "50k", "800000".
 *
 * @param input - Free-form amount text.
 * @returns Whole rupees, or `null` when the text is not a non-negative amount.
 * @example
 * ```ts
 * parseINR('8.5 lakh'); // => 850000
 * parseINR('abc'); // => null
 * ```
 */
export function parseINR(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const text = input
    .trim()
    .toLowerCase()
    .replace(/,/g, '')
    .replace(/₹/g, '')
    .replace(/rs\.?/g, '')
    .trim();
  if (!text) return null;

  const withUnit = parseUnitAmount(text);
  if (withUnit !== null) return withUnit;

  // Pure number
  const num = parseFloat(text);
  if (!isNaN(num) && num >= 0 && isFinite(num)) {
    return Math.round(num);
  }

  return null;
}

/** Split `total` as evenly as possible across `keys` (first keys receive the leftover rupees). */
function splitEqually<K extends string>(keys: K[], total: number): Record<K, number> {
  const equalShare = Math.floor(total / keys.length);
  const remainder = total % keys.length;
  const res = {} as Record<K, number>;
  keys.forEach((key, i) => {
    res[key] = equalShare + (i < remainder ? 1 : 0);
  });
  return res;
}

/**
 * Largest Remainder (Hare-Niemeyer) rounding: splits `targetTotal` in proportion to `proportions`
 * so the rounded integers sum EXACTLY to the target with zero drift.
 *
 * @param proportions - Non-negative weights keyed by name.
 * @param targetTotal - Integer total to distribute.
 * @returns Integer share per key; all zeros for a non-positive target, an equal split for all-zero weights.
 * @example
 * ```ts
 * largestRemainderRound({ a: 1, b: 1, c: 1 }, 100); // => { a: 34, b: 33, c: 33 }
 * ```
 */
export function largestRemainderRound<K extends string>(
  proportions: Record<K, number>,
  targetTotal: number,
): Record<K, number> {
  const keys = Object.keys(proportions) as K[];
  if (keys.length === 0) return {} as Record<K, number>;
  if (targetTotal <= 0) {
    const zeroResult = {} as Record<K, number>;
    for (const key of keys) zeroResult[key] = 0;
    return zeroResult;
  }

  const rawSum = keys.reduce((sum, k) => sum + proportions[k], 0);
  if (rawSum === 0) {
    return splitEqually(keys, targetTotal);
  }

  // Calculate integer parts and fractional remainders
  const floors = {} as Record<K, number>;
  const remainders: { key: K; remainder: number }[] = [];
  let currentSum = 0;

  for (const key of keys) {
    const exact = (proportions[key] / rawSum) * targetTotal;
    const floor = Math.floor(exact);
    floors[key] = floor;
    currentSum += floor;
    remainders.push({ key, remainder: exact - floor });
  }

  let deficit = targetTotal - currentSum;
  // Sort descending by largest remainder
  remainders.sort((a, b) => b.remainder - a.remainder);

  for (const item of remainders) {
    if (deficit <= 0) break;
    floors[item.key] += 1;
    deficit--;
  }

  return floors;
}
