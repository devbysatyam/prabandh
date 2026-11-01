import type { Plan } from '../schemas';
import { budgetStatus, type BudgetStatus } from './budget';
import { aggregateGuests, type GuestSummary } from './guests';
import { formatINR } from './money';
import { buildSchedule, diffDays, type ScheduledTask } from './timeline';

/**
 * Urgency of an advisor insight, from most to least pressing.
 *
 * @example
 * ```ts
 * const s: InsightSeverity = 'critical';
 * ```
 */
export type InsightSeverity = 'critical' | 'warning' | 'suggestion';
/**
 * Tab an insight deep-links to when the user acts on it.
 *
 * @example
 * ```ts
 * const tab: InsightTab = 'budget';
 * ```
 */
export type InsightTab =
  'overview' | 'budget' | 'venues' | 'guests' | 'timeline' | 'vendors' | 'runsheet';

/**
 * A single prioritised, deterministic recommendation shown on the overview.
 *
 * @example
 * ```ts
 * const i: Insight = {
 *   id: 'insight-overbudget',
 *   severity: 'critical',
 *   tab: 'budget',
 *   title: 'Over budget by ₹50,000',
 *   detail: 'Check the trade-off solutions.',
 * };
 * ```
 */
export interface Insight {
  id: string;
  severity: InsightSeverity;
  tab: InsightTab;
  title: string;
  detail: string;
}

/**
 * Deterministically analyses the plan and returns prioritised insights.
 * 100% offline, zero latency, guaranteed reliability.
 *
 * @param plan - The current plan.
 * @param today - Reference date (YYYY-MM-DD) used for overdue / countdown maths.
 * @returns Insights in rule order (budget, schedule, venue, RSVPs, payments, quotes); empty when all is well.
 * @example
 * ```ts
 * const insights = planInsights(plan, '2026-11-02');
 * insights.some((i) => i.severity === 'critical'); // => true when over budget or overdue
 * ```
 */
export function planInsights(plan: Plan, today: string): Insight[] {
  const status = budgetStatus(plan);
  const daysToEvent = diffDays(today, plan.eventDate);
  const schedule = buildSchedule(plan.tasks, plan.eventDate, today);
  const guests = aggregateGuests(plan.guestList);

  return [
    overBudgetInsight(plan, status),
    ...scheduleInsights(schedule),
    venueUnbookedInsight(plan, daysToEvent),
    rsvpPendingInsight(guests, daysToEvent),
    ...paymentDueInsights(plan, today),
    quotesNeededInsight(plan),
  ].filter((i): i is Insight => i !== null);
}

/** Critical: guest count needs more catering than budgeted. */
function overBudgetInsight(plan: Plan, status: BudgetStatus): Insight | null {
  if (!status.isOverBudget) return null;
  return {
    id: 'insight-overbudget',
    severity: 'critical',
    tab: 'budget',
    title: `Over budget by ${formatINR(status.overBy)}`,
    detail: `Your guest count of ${plan.guests} requires ${formatINR(status.overBy)} more catering than budgeted. Check the 3 automated trade-off solutions.`,
  };
}

/** Critical overdue-task insight followed by the at-risk warning (each null when not applicable). */
function scheduleInsights(schedule: ScheduledTask[]): (Insight | null)[] {
  const overdueTasks = schedule.filter((t) => t.isOverdue);
  const atRiskTasks = schedule.filter((t) => t.isAtRisk && !t.isOverdue);
  const overdue: Insight | null =
    overdueTasks.length > 0
      ? {
          id: 'insight-overdue',
          severity: 'critical',
          tab: 'timeline',
          title: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue`,
          detail: `Delayed milestone: "${overdueTasks[0]?.title}". Mark as done or adjust timeline to prevent downstream delays.`,
        }
      : null;
  const atRisk: Insight | null =
    atRiskTasks.length > 0
      ? {
          id: 'insight-at-risk',
          severity: 'warning',
          tab: 'timeline',
          title: `${atRiskTasks.length} milestone${atRiskTasks.length > 1 ? 's' : ''} at risk of delay`,
          detail: `Dependencies are pushing finish dates past nominal deadlines. Review timeline graph.`,
        }
      : null;
  return [overdue, atRisk];
}

/** Warning: venue not booked with fewer than 90 days to go. */
function venueUnbookedInsight(plan: Plan, daysToEvent: number): Insight | null {
  const venueVendor = plan.vendors.find((v) => v.category === 'venue');
  if (daysToEvent >= 90 || venueVendor?.status === 'booked') return null;
  return {
    id: 'insight-venue-unbooked',
    severity: 'warning',
    tab: 'vendors',
    title: 'Primary venue not yet locked',
    detail: `Event is ${daysToEvent} days away. Booking the venue is critical to freeze caterer logistics and invitation dispatches.`,
  };
}

/** Warning: low RSVP confirmation inside the final month. */
function rsvpPendingInsight(guests: GuestSummary, daysToEvent: number): Insight | null {
  if (daysToEvent >= 30 || guests.totalInvitedCount <= 0 || guests.confirmationRate >= 60) {
    return null;
  }
  return {
    id: 'insight-rsvp-pending',
    severity: 'warning',
    tab: 'guests',
    title: `${guests.pendingCount} RSVPs still pending confirmation`,
    detail: `Only ${guests.confirmationRate}% confirmed with under a month to go. Send a friendly reminder to freeze the caterer plate count.`,
  };
}

/** Warnings for pending vendor payments falling due within the next 7 days. */
function paymentDueInsights(plan: Plan, today: string): Insight[] {
  const insights: Insight[] = [];
  for (const v of plan.vendors) {
    for (const p of v.payments) {
      const daysToPayment = diffDays(today, p.dueDate);
      if (p.status === 'pending' && daysToPayment >= 0 && daysToPayment <= 7) {
        insights.push({
          id: `insight-pay-${p.id}`,
          severity: 'warning',
          tab: 'vendors',
          title: `Payment due for ${v.name}: ${formatINR(p.amount)}`,
          detail: `"${p.title}" installment is due in ${daysToPayment} days (${p.dueDate}).`,
        });
      }
    }
  }
  return insights;
}

/** Suggestion: shortlisted / contacted vendors still need comparable quotes. */
function quotesNeededInsight(plan: Plan): Insight | null {
  const unquotedCategories = plan.vendors.filter(
    (v) => v.status === 'shortlisted' || v.status === 'contacted',
  );
  if (unquotedCategories.length === 0) return null;
  return {
    id: 'insight-quotes-needed',
    severity: 'suggestion',
    tab: 'vendors',
    title: `Compare quotes for ${unquotedCategories.length} pending vendor categories`,
    detail: `Collect quotes for ${unquotedCategories
      .map((v) => v.category)
      .slice(0, 3)
      .join(', ')} to turn estimates into verified numbers.`,
  };
}

/**
 * Returns structured, newline-separated plan facts for AI prompting or local Q&A.
 *
 * @param plan - The current plan.
 * @param today - Reference date (YYYY-MM-DD).
 * @returns Multi-line `Label: value` text (title, date, budget, guests, overdue tasks, vendors).
 * @example
 * ```ts
 * planFacts(plan, '2026-11-02').split('\n')[0]; // => 'Title: Sharma & Verma Wedding'
 * ```
 */
export function planFacts(plan: Plan, today: string): string {
  const status = budgetStatus(plan);
  const daysLeft = diffDays(today, plan.eventDate);
  const schedule = buildSchedule(plan.tasks, plan.eventDate, today);
  const overdue = schedule.filter((t) => t.isOverdue).map((t) => t.title);
  const guests = aggregateGuests(plan.guestList);

  return [
    `Title: ${plan.title}`,
    `Occasion: ${plan.occasion}`,
    `Date: ${plan.eventDate} (${daysLeft} days to go)`,
    `City: ${plan.city ?? 'Not specified'}`,
    `Budget: Total ${formatINR(status.total)}, Committed ${formatINR(status.committed)}, Estimated ${formatINR(status.estimated)}`,
    `Status: ${status.isOverBudget ? `OVER BUDGET by ${formatINR(status.overBy)}` : 'Within Budget'}`,
    `Contingency buffer: ${formatINR(status.contingencyLeft)}`,
    `Per-plate rate: ${formatINR(plan.perPlate)}`,
    `Guests: ${plan.guests} target headcount. (${guests.confirmedCount} confirmed, ${guests.pendingCount} pending)`,
    `Overdue tasks: ${overdue.length > 0 ? overdue.join('; ') : 'None'}`,
    `Vendors: ${plan.vendors.filter((v) => v.status === 'booked').length} booked of ${plan.vendors.length} categories`,
  ].join('\n');
}

/**
 * Deterministic local answering engine used when AI is offline or no API key is configured.
 * Matches English / Hinglish keywords for budget, tasks, guests and vendors.
 *
 * @param question - Free-text user question.
 * @param plan - The current plan.
 * @param today - Reference date (YYYY-MM-DD).
 * @returns A grounded answer built only from plan data.
 * @example
 * ```ts
 * localAnswer('kitna kharcha hua?', plan, '2026-11-02'); // => 'Your budget is in good standing! ...'
 * ```
 */
export function localAnswer(question: string, plan: Plan, today: string): string {
  const q = question.toLowerCase();
  const has = (...words: string[]): boolean => words.some((w) => q.includes(w));
  const status = budgetStatus(plan);

  if (has('over budget', 'budget', 'kharcha', 'paisa')) return budgetAnswer(plan, status);
  if (has('next', 'kya karu', 'priority', 'task', 'due')) {
    return nextStepAnswer(buildSchedule(plan.tasks, plan.eventDate, today));
  }
  if (has('guest', 'rsvp', 'mehmaan')) return guestAnswer(plan, aggregateGuests(plan.guestList));
  if (has('vendor', 'caterer', 'negotiat', 'quote')) return vendorAnswer(plan);
  const daysLeft = diffDays(today, plan.eventDate);
  return `We have ${daysLeft} days remaining until ${plan.title} on ${plan.eventDate}. Total budget is ${formatINR(status.total)} for ${plan.guests} guests. Open the Overview tab for your action items or ask any specific question about your budget, timeline, guests, or vendors!`;
}

function budgetAnswer(plan: Plan, status: BudgetStatus): string {
  if (status.isOverBudget) {
    return `You are currently over budget by ${formatINR(status.overBy)}. This is because your guest count (${plan.guests}) at ${formatINR(plan.perPlate)}/plate requires more catering than allocated. Please check the Budget tab to apply one of the 3 automated options: trim guests, adjust flexible categories, or use your ${formatINR(status.contingencyLeft)} contingency buffer.`;
  }
  return `Your budget is in good standing! Out of your total ${formatINR(status.total)} budget, ${formatINR(status.committed)} is committed to booked vendors, and you still have ${formatINR(status.total - status.committed)} in remaining buffer and estimates.`;
}

function nextStepAnswer(schedule: ScheduledTask[]): string {
  const overdue = schedule.filter((t) => t.isOverdue);
  if (overdue.length > 0) {
    return `Your top priority right now is resolving ${overdue.length} overdue task(s), especially: "${overdue[0]?.title}". Open the Timeline tab to mark it completed or adjust its lead time.`;
  }
  const nextTask = schedule.find((t) => t.status !== 'done');
  if (nextTask) {
    return `Your next milestone is "${nextTask.title}", due in ${nextTask.daysRemaining} days (${nextTask.effectiveDate}).`;
  }
  return `All planned milestones are currently up to date! Focus on following up with vendor quotes and collecting guest RSVPs.`;
}

function guestAnswer(plan: Plan, guests: GuestSummary): string {
  if (guests.totalEntries > 0) {
    return `You are planning for ${plan.guests} guests total. From your guest list, you have ${guests.confirmedCount} confirmed (${guests.confirmationRate}%), ${guests.pendingCount} pending, and ${guests.declinedCount} declined. Dietary breakdown: ${guests.byDiet.veg} Veg, ${guests.byDiet.jain} Jain, and ${guests.byDiet.non_veg} Non-Veg.`;
  }
  return `You have set a target headcount of ${plan.guests} guests. Switch to the Guests tab to start adding families and tracking RSVPs with automatic catering recalculation.`;
}

function vendorAnswer(plan: Plan): string {
  return `You have ${plan.vendors.filter((v) => v.status === 'booked').length} booked vendors. For unbooked vendors, make sure to ask whether taxes (18% GST) are included, check for minimum plate guarantees, and negotiate advances down to 25%–30%. You can generate instant WhatsApp negotiation messages from the Vendors tab!`;
}
