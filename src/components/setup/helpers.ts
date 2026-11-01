import type { Category, Intake, Occasion } from '../../schemas';
import { PRIORITY_ITEMS } from '../../schemas';
import { formatINR, parseINR } from '../../engine/money';
import {
  CATERING_BUDGET_SHARE,
  DEFAULT_EVENT_LEAD_MONTHS,
  FALLBACK_BUDGET,
  FALLBACK_PRIORITY,
  MIN_BUDGET,
  MIN_GUESTS,
} from './constants';

/** Values held by the structured intake form. */
export interface SetupFormValues {
  occasion: Occasion;
  budgetString: string;
  guests: number;
  eventDate: string;
  vibe: string;
  city: string;
  priorityKeys: string[];
}

/** ISO date a few months from now, used as the default celebration date. */
export function defaultEventDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + DEFAULT_EVENT_LEAD_MONTHS);
  return d.toISOString().slice(0, 10);
}

/** Map the chosen priority card ids to their unique, non-contingency budget categories. */
export function categoriesFromPriorityKeys(
  priorityKeys: readonly string[],
): Exclude<Category, 'contingency'>[] {
  const selected = PRIORITY_ITEMS.filter((item) => priorityKeys.includes(item.id));
  return Array.from(new Set(selected.map((item) => item.category))).filter(
    (c): c is Exclude<Category, 'contingency'> => c !== 'contingency',
  );
}

/** Priority card ids whose category appears in the AI-parsed priorities. */
export function priorityKeysFromCategories(categories: readonly string[]): string[] {
  return PRIORITY_ITEMS.filter((item) => categories.includes(item.category)).map((item) => item.id);
}

/** Convert the form values into a validated, clamped Intake. */
export function buildIntake(values: SetupFormValues): Intake {
  const parsedBudget = parseINR(values.budgetString) ?? FALLBACK_BUDGET;
  const categories = categoriesFromPriorityKeys(values.priorityKeys);
  return {
    occasion: values.occasion,
    totalBudget: Math.max(MIN_BUDGET, parsedBudget),
    guests: Math.max(MIN_GUESTS, values.guests),
    eventDate: values.eventDate,
    vibe: values.vibe,
    city: values.city.trim() || undefined,
    priorities: categories.length > 0 ? categories : [FALLBACK_PRIORITY],
    priorityKeys: values.priorityKeys,
  };
}

/** Estimated catering cost per plate (rupees) for the live hint. */
export function estimatePerPlate(budget: number, guests: number): number {
  return budget > 0 && guests > 0 ? Math.round((budget * CATERING_BUDGET_SHARE) / guests) : 0;
}

/** Confirmation message shown after the AI fills the form. */
export function parseSuccessMessage(result: Intake): string {
  return `✨ Vision recognized: ${result.guests} guests, ${formatINR(result.totalBudget)}, ${result.eventDate} in ${result.city || 'your city'}. Review values below and click Create / Save.`;
}
