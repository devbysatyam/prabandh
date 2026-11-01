import { CATEGORIES, type Allocation, type Category, type Occasion, type Plan } from '../schemas';
import { largestRemainderRound } from './money';
import { OCCASION_PRESETS } from './presets';

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

export interface RedistributionResult {
  allocation: Allocation;
  changes: { category: Category; delta: number }[];
  capped: boolean;
  maxFeasible: number;
}

export interface OverBudgetOption {
  id: 'reduce_guests' | 'trim_categories' | 'use_contingency';
  title: string;
  description: string;
  rupeeImpact: number;
  canApply: boolean;
}

/**
 * Computes category allocation from presets, applying priority multipliers (×1.25)
 * and strictly preserving the exact sum to totalBudget using largest remainder rounding.
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
  return rounded as Allocation;
}

/**
 * Live redistribution: When one category amount changes, the delta is absorbed
 * proportionally by other UNLOCKED categories without letting any category go below zero.
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
  const targetOtherSum = otherPool - delta;

  const proportions: Record<string, number> = {};
  for (const c of otherUnlocked) {
    proportions[c] = allocation[c];
  }

  const distributed = largestRemainderRound(proportions, targetOtherSum);

  const changes: { category: Category; delta: number }[] = [];
  changes.push({ category, delta });

  for (const c of otherUnlocked) {
    const oldVal = allocation[c];
    const newVal = distributed[c] ?? 0;
    newAlloc[c] = newVal;
    if (newVal !== oldVal) {
      changes.push({ category: c, delta: newVal - oldVal });
    }
  }

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

/**
 * Calculates live catering requirement based on perPlate * guests.
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

/**
 * Returns overall budget status, tracking committed vendor contracts vs unquoted estimates.
 */
export function budgetStatus(plan: Plan): BudgetStatus {
  const total = plan.totalBudget;
  const allocated = CATEGORIES.reduce((sum, c) => sum + plan.allocation[c], 0);

  // Calculate committed spend from booked vendors or accepted quotes
  let committed = 0;
  const categoriesWithQuotes = new Set<Category>();

  for (const v of plan.vendors) {
    if (v.status === 'booked' && v.quote && v.quote.totalPrice) {
      committed += v.quote.totalPrice;
      categoriesWithQuotes.add(v.category);
    } else if (v.payments && v.payments.length > 0) {
      const vendorPaid = v.payments.reduce((s, p) => s + p.amount, 0);
      committed += vendorPaid;
      categoriesWithQuotes.add(v.category);
    }
  }

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

/**
 * Generates up to 3 concrete, deterministic options to resolve an over-budget condition.
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
  const unlockedNonPriorities = CATEGORIES.filter(
    (c) =>
      c !== 'catering' &&
      c !== 'contingency' &&
      !plan.locked.includes(c) &&
      !plan.priorities.includes(c),
  );
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
    const unlockedNonPriorities = CATEGORIES.filter(
      (c) =>
        c !== 'catering' &&
        c !== 'contingency' &&
        !plan.locked.includes(c) &&
        !plan.priorities.includes(c),
    );
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
