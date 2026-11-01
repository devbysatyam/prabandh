import { CATEGORIES, type Allocation, type Category, type Occasion, type Plan } from '../schemas';
import { largestRemainderRound } from './money';
import { OCCASION_PRESETS } from './presets';

/**
 * Overall budget position derived from allocation, vendor contracts and guest count.
 *
 * @example
 * ```ts
 * const s = budgetStatus(plan);
 * s.isOverBudget ? s.overBy : 0;
 * ```
 */
export interface BudgetStatus {
  total: number;
  allocated: number;
  committed: number;
  estimated: number;
  overBy: number;
  overByPct: number;
  contingencyLeft: number;
  isOverBudget: boolean;
}

/**
 * Outcome of {@link redistribute}: the new allocation and what changed.
 *
 * @example
 * ```ts
 * const r = redistribute(allocation, 'decor', 200000);
 * r.capped; // => true when the requested amount was not feasible
 * ```
 */
export interface RedistributionResult {
  allocation: Allocation;
  changes: { category: Category; delta: number }[];
  capped: boolean;
  maxFeasible: number;
}

/**
 * One concrete way to resolve an over-budget condition.
 *
 * @example
 * ```ts
 * const o: OverBudgetOption = {
 *   id: 'use_contingency',
 *   title: 'Use contingency buffer',
 *   description: '...',
 *   rupeeImpact: 50000,
 *   canApply: true,
 * };
 * ```
 */
export interface OverBudgetOption {
  id: 'reduce_guests' | 'trim_categories' | 'use_contingency';
  title: string;
  description: string;
  rupeeImpact: number;
  canApply: boolean;
}

/**
 * Computes category allocation from occasion presets, applying priority multipliers (x1.25)
 * and preserving the exact sum to the total via largest-remainder rounding.
 *
 * @param totalBudget - Total budget in whole rupees.
 * @param occasion - Occasion whose preset percentages are used.
 * @param priorities - Categories weighted x1.25 (contingency is never boosted).
 * @returns Integer rupee allocation per category that sums exactly to `totalBudget`.
 * @example
 * ```ts
 * const a = allocate(1_000_000, 'wedding', ['catering']);
 * Object.values(a).reduce((x, y) => x + y, 0); // => 1000000
 * ```
 */
export function allocate(
  totalBudget: number,
  occasion: Occasion,
  priorities: Category[] = [],
): Allocation {
  const preset = OCCASION_PRESETS[occasion];
  const weights: Record<Category, number> = { ...preset };

  // Prioritized non-contingency categories get 1.25x weight
  for (const p of priorities) {
    if (p !== 'contingency' && weights[p] !== undefined) {
      weights[p] = weights[p] * 1.25;
    }
  }

  // Renormalize non-contingency to 90% (contingency stays 10%)
  const nonContingencySum = (CATEGORIES.filter((c) => c !== 'contingency') as Category[]).reduce(
    (sum, c) => sum + weights[c],
    0,
  );

  const normalized: Record<Category, number> = {
    venue: 0,
    catering: 0,
    decor: 0,
    photography: 0,
    entertainment: 0,
    misc: 0,
    contingency: 10,
  };

  for (const c of CATEGORIES) {
    if (c === 'contingency') {
      normalized.contingency = 10;
    } else {
      normalized[c] = (weights[c] / nonContingencySum) * 90;
    }
  }

  const rounded = largestRemainderRound(normalized, totalBudget);
  return rounded;
}

/**
 * Live redistribution: when one category changes, the delta is absorbed proportionally by the
 * other UNLOCKED categories without letting any category drop below zero.
 *
 * @param allocation - Current allocation.
 * @param category - Category being edited.
 * @param newAmount - Requested amount for that category (rupees).
 * @param locked - Categories that must not change.
 * @returns New allocation (total preserved), per-category changes, and whether the request was capped.
 * @example
 * ```ts
 * const r = redistribute(allocation, 'decor', allocation.decor + 10_000, ['venue']);
 * r.changes[0]; // => { category: 'decor', delta: 10000 }
 * ```
 */
export function redistribute(
  allocation: Allocation,
  category: Category,
  newAmount: number,
  locked: Category[] = [],
): RedistributionResult {
  const currentTotal = CATEGORIES.reduce((s, c) => s + allocation[c], 0);
  const currentAmount = allocation[category];
  const delta = Math.round(newAmount) - currentAmount;

  if (delta === 0) {
    return {
      allocation: { ...allocation },
      changes: [],
      capped: false,
      maxFeasible: currentAmount,
    };
  }

  const otherUnlocked = CATEGORIES.filter((c) => c !== category && !locked.includes(c));

  // If no other category can absorb the delta
  if (otherUnlocked.length === 0) {
    return {
      allocation: { ...allocation },
      changes: [],
      capped: true,
      maxFeasible: currentAmount,
    };
  }

  const otherPool = otherUnlocked.reduce((s, c) => s + allocation[c], 0);

  // If we are increasing, we cannot take more than what other unlocked categories have
  if (delta > 0 && delta > otherPool) {
    const maxFeasible = currentAmount + otherPool;
    const cappedResult = redistribute(allocation, category, maxFeasible, locked);
    return {
      ...cappedResult,
      capped: true,
      maxFeasible,
    };
  }

  // We are within feasible range. Distribute -delta proportionally across other unlocked
  const newAlloc: Allocation = { ...allocation, [category]: Math.round(newAmount) };
  const changes = absorbDelta(allocation, newAlloc, otherUnlocked, otherPool - delta);
  changes.unshift({ category, delta });

  // Verify exact sum
  const finalSum = CATEGORIES.reduce((s, c) => s + newAlloc[c], 0);
  if (finalSum !== currentTotal) {
    // Correct minor 1-rupee difference on category with largest room
    const diff = currentTotal - finalSum;
    const firstOther = otherUnlocked[0];
    if (firstOther && newAlloc[firstOther] + diff >= 0) {
      newAlloc[firstOther] += diff;
    }
  }

  return {
    allocation: newAlloc,
    changes,
    capped: false,
    maxFeasible: currentAmount + otherPool,
  };
}

/** Spread `targetOtherSum` over `categories` in proportion to their old amounts, mutating `newAlloc`. */
function absorbDelta(
  allocation: Allocation,
  newAlloc: Allocation,
  categories: Category[],
  targetOtherSum: number,
): { category: Category; delta: number }[] {
  const proportions: Record<string, number> = {};
  for (const c of categories) {
    proportions[c] = allocation[c];
  }
  const distributed = largestRemainderRound(proportions, targetOtherSum);
  const changes: { category: Category; delta: number }[] = [];
  for (const c of categories) {
    const oldVal = allocation[c];
    const newVal = distributed[c] ?? 0;
    newAlloc[c] = newVal;
    if (newVal !== oldVal) {
      changes.push({ category: c, delta: newVal - oldVal });
    }
  }
  return changes;
}

/**
 * Calculates the catering requirement for a guest count (`perPlate x guests`) against the allocation.
 *
 * @param plan - The current plan.
 * @param newGuests - Hypothetical guest count (clamped to at least 1).
 * @returns Required vs current catering, the difference and whether it exceeds the allocation.
 * @example
 * ```ts
 * scaleGuests(plan, 250).difference; // => rupees of extra catering needed (negative if spare)
 * ```
 */
export function scaleGuests(
  plan: Plan,
  newGuests: number,
): {
  requiredCatering: number;
  currentCatering: number;
  difference: number;
  isOverBudget: boolean;
} {
  const safeGuests = Math.max(1, Math.round(newGuests));
  const requiredCatering = Math.round(plan.perPlate * safeGuests);
  const currentCatering = plan.allocation.catering;
  const difference = requiredCatering - currentCatering;

  return {
    requiredCatering,
    currentCatering,
    difference,
    isOverBudget: difference > 0,
  };
}

/** Sum committed spend from booked vendors' quotes or scheduled payments, and the categories it covers. */
function committedSpend(plan: Plan): { committed: number; categoriesWithQuotes: Set<Category> } {
  let committed = 0;
  const categoriesWithQuotes = new Set<Category>();
  for (const v of plan.vendors) {
    if (v.status === 'booked' && v.quote && v.quote.totalPrice) {
      committed += v.quote.totalPrice;
      categoriesWithQuotes.add(v.category);
    } else if (v.payments && v.payments.length > 0) {
      committed += v.payments.reduce((s, p) => s + p.amount, 0);
      categoriesWithQuotes.add(v.category);
    }
  }
  return { committed, categoriesWithQuotes };
}

/**
 * Returns the overall budget status, tracking committed vendor contracts versus unquoted estimates.
 *
 * @param plan - The current plan.
 * @returns Totals, committed and estimated spend, overspend (if any) and remaining contingency.
 * @example
 * ```ts
 * const s = budgetStatus(plan);
 * s.total - s.committed; // remaining buffer and estimates
 * ```
 */
export function budgetStatus(plan: Plan): BudgetStatus {
  const total = plan.totalBudget;
  const allocated = CATEGORIES.reduce((sum, c) => sum + plan.allocation[c], 0);

  const { committed, categoriesWithQuotes } = committedSpend(plan);

  let estimated = 0;
  for (const c of CATEGORIES) {
    if (!categoriesWithQuotes.has(c)) {
      estimated += plan.allocation[c];
    }
  }

  // Check if guest count demands more catering than allocated
  const guestCatering = scaleGuests(plan, plan.guests);
  const overBy = guestCatering.difference > 0 ? guestCatering.difference : 0;
  const overByPct = total > 0 ? Math.round((overBy / total) * 100) : 0;

  return {
    total,
    allocated,
    committed,
    estimated,
    overBy,
    overByPct,
    contingencyLeft: plan.allocation.contingency,
    isOverBudget: overBy > 0,
  };
}

/** Categories that can be trimmed to fund catering: not catering/contingency, locked or prioritised. */
function flexibleCategories(plan: Plan): Category[] {
  return CATEGORIES.filter(
    (c) =>
      c !== 'catering' &&
      c !== 'contingency' &&
      !plan.locked.includes(c) &&
      !plan.priorities.includes(c),
  );
}

/**
 * Generates up to three concrete, deterministic options to resolve an over-budget condition.
 *
 * @param plan - The current plan.
 * @returns Applicable options (reduce guests, trim flexible categories, use contingency); empty when within budget.
 * @example
 * ```ts
 * generateOverBudgetOptions(plan).map((o) => o.id); // => ['reduce_guests', 'use_contingency']
 * ```
 */
export function generateOverBudgetOptions(plan: Plan): OverBudgetOption[] {
  const status = budgetStatus(plan);
  if (!status.isOverBudget) return [];

  const overBy = status.overBy;
  const options: OverBudgetOption[] = [];

  // Option 1: Reduce guests by N
  if (plan.perPlate > 0) {
    const guestsToTrim = Math.ceil(overBy / plan.perPlate);
    const maxTrimAllowed = Math.floor(plan.guests * 0.25); // At most 25% of guests
    if (guestsToTrim <= maxTrimAllowed && plan.guests - guestsToTrim >= 10) {
      options.push({
        id: 'reduce_guests',
        title: `Reduce guest count by ${guestsToTrim}`,
        description: `Trimming ${guestsToTrim} guests (from ${plan.guests} to ${plan.guests - guestsToTrim}) saves exact ₹${overBy.toLocaleString('en-IN')}, bringing catering back in budget.`,
        rupeeImpact: overBy,
        canApply: true,
      });
    }
  }

  // Option 2: Trim unlocked flexible categories
  const unlockedNonPriorities = flexibleCategories(plan);
  const flexiblePool = unlockedNonPriorities.reduce((s, c) => s + plan.allocation[c], 0);

  if (flexiblePool >= overBy && flexiblePool > 0) {
    options.push({
      id: 'trim_categories',
      title: 'Proportionally trim non-priority categories',
      description: `Absorb ₹${overBy.toLocaleString('en-IN')} by slightly reducing ${unlockedNonPriorities.length} flexible categories (${unlockedNonPriorities.join(', ')}).`,
      rupeeImpact: overBy,
      canApply: true,
    });
  }

  // Option 3: Use contingency buffer
  if (plan.allocation.contingency >= overBy) {
    const remainingContingency = plan.allocation.contingency - overBy;
    options.push({
      id: 'use_contingency',
      title: 'Use contingency buffer',
      description: `Draw ₹${overBy.toLocaleString('en-IN')} from the contingency pool. Leaves ₹${remainingContingency.toLocaleString('en-IN')} buffer for surprises.`,
      rupeeImpact: overBy,
      canApply: true,
    });
  }

  return options;
}

/**
 * Applies an over-budget resolution option to the plan deterministically.
 *
 * @param plan - The current plan.
 * @param optionId - Which resolution to apply.
 * @returns A new plan; the original is returned unchanged when within budget or the option is not feasible.
 * @example
 * ```ts
 * const fixed = applyOption(plan, 'use_contingency');
 * budgetStatus(fixed).isOverBudget; // => false
 * ```
 */
export function applyOption(
  plan: Plan,
  optionId: 'reduce_guests' | 'trim_categories' | 'use_contingency',
): Plan {
  const status = budgetStatus(plan);
  if (!status.isOverBudget) return plan;
  const overBy = status.overBy;

  if (optionId === 'reduce_guests') {
    const guestsToTrim = Math.ceil(overBy / plan.perPlate);
    const newGuests = Math.max(1, plan.guests - guestsToTrim);
    return {
      ...plan,
      guests: newGuests,
    };
  }

  if (optionId === 'use_contingency') {
    const newAlloc = { ...plan.allocation };
    newAlloc.contingency = Math.max(0, newAlloc.contingency - overBy);
    newAlloc.catering = newAlloc.catering + overBy;
    return {
      ...plan,
      allocation: newAlloc,
    };
  }

  if (optionId === 'trim_categories') {
    const unlockedNonPriorities = flexibleCategories(plan);
    const pool = unlockedNonPriorities.reduce((s, c) => s + plan.allocation[c], 0);
    if (pool < overBy) return plan;

    const newAlloc = { ...plan.allocation };
    newAlloc.catering += overBy;

    const targetPool = pool - overBy;
    const proportions: Record<string, number> = {};
    for (const c of unlockedNonPriorities) {
      proportions[c] = plan.allocation[c];
    }
    const trimmed = largestRemainderRound(proportions, targetPool);
    for (const c of unlockedNonPriorities) {
      newAlloc[c] = trimmed[c] ?? 0;
    }

    return {
      ...plan,
      allocation: newAlloc,
    };
  }

  return plan;
}
