/**
 * Indian Rupee (INR) money calculation, parsing, and formatting utilities.
 * All internal money values are represented as non-negative integer rupees.
 */

/**
 * Formats a number of rupees into Indian comma grouped string, e.g. ₹8,00,000.
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
 * Converts integer rupees into compact Lakh / Crore human-readable string.
 * e.g. 850000 -> "₹8.5 Lakh", 25000000 -> "₹2.5 Crore", 75000 -> "₹75 Thousand"
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

/**
 * Robust, forgiving parser for user typed amounts.
 * Handles: "8 lakh", "8.5L", "2 crore", "2.5 cr", "₹8,00,000", "800000", "50k", etc.
 */
export function parseINR(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const text = input.trim().toLowerCase().replace(/,/g, '').replace(/₹/g, '').replace(/rs\.?/g, '').trim();
  if (!text) return null;

  // Crore match: e.g. "2.5 crore", "2cr", "1.2crores"
  const crMatch = /^([\d.]+)\s*(?:crore|crores|cr)$/.exec(text);
  if (crMatch && crMatch[1]) {
    const val = parseFloat(crMatch[1]);
    if (!isNaN(val) && val >= 0) return Math.round(val * 10_000_000);
  }

  // Lakh match: e.g. "8.5 lakh", "8l", "8.5 lac", "12lakhs"
  const lakhMatch = /^([\d.]+)\s*(?:lakh|lakhs|lac|lacs|l)$/.exec(text);
  if (lakhMatch && lakhMatch[1]) {
    const val = parseFloat(lakhMatch[1]);
    if (!isNaN(val) && val >= 0) return Math.round(val * 100_000);
  }

  // Thousand match: e.g. "50k", "75 thousand"
  const kMatch = /^([\d.]+)\s*(?:k|thousand|thousands)$/.exec(text);
  if (kMatch && kMatch[1]) {
    const val = parseFloat(kMatch[1]);
    if (!isNaN(val) && val >= 0) return Math.round(val * 1_000);
  }

  // Pure number
  const num = parseFloat(text);
  if (!isNaN(num) && num >= 0 && isFinite(num)) {
    return Math.round(num);
  }

  return null;
}

/**
 * Largest Remainder (Hare-Niemeyer) rounding method.
 * Guarantees that rounded integer categories sum EXACTLY to targetTotal with zero rounding drift.
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

  const rawSum = keys.reduce((sum, k) => sum + proportions[k]!, 0);
  if (rawSum === 0) {
    const equalShare = Math.floor(targetTotal / keys.length);
    let remainder = targetTotal % keys.length;
    const res = {} as Record<K, number>;
    for (const key of keys) {
      res[key] = equalShare + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    }
    return res;
  }

  // Calculate integer parts and fractional remainders
  const floors = {} as Record<K, number>;
  const remainders: { key: K; remainder: number }[] = [];
  let currentSum = 0;

  for (const key of keys) {
    const exact = (proportions[key]! / rawSum) * targetTotal;
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
    floors[item.key]! += 1;
    deficit--;
  }

  return floors;
}
