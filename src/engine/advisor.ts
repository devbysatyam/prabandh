import type { Plan } from '../schemas';
import { budgetStatus } from './budget';
import { aggregateGuests } from './guests';
import { formatINR } from './money';
import { buildSchedule, diffDays } from './timeline';

export type InsightSeverity = 'critical' | 'warning' | 'suggestion';
export type InsightTab =
  'overview' | 'budget' | 'venues' | 'guests' | 'timeline' | 'vendors' | 'runsheet';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  tab: InsightTab;
  title: string;
  detail: string;
}

/**
 * Deterministically analyzes the plan and generates prioritized insights.
 * 100% offline, zero latency, guaranteed reliability.
 */
export function planInsights(plan: Plan, today: string): Insight[] {
  const insights: Insight[] = [];
  const status = budgetStatus(plan);
  const daysToEvent = diffDays(today, plan.eventDate);
  const schedule = buildSchedule(plan.tasks, plan.eventDate, today);
  const guests = aggregateGuests(plan.guestList);

  // 1. Budget issues (Critical)
  if (status.isOverBudget) {
    insights.push({
      id: 'insight-overbudget',
      severity: 'critical',
      tab: 'budget',
      title: `Over budget by ${formatINR(status.overBy)}`,
      detail: `Your guest count of ${plan.guests} requires ${formatINR(status.overBy)} more catering than budgeted. Check the 3 automated trade-off solutions.`,
    });
  }

  // 2. Overdue tasks (Critical)
  const overdueTasks = schedule.filter((t) => t.isOverdue);
  if (overdueTasks.length > 0) {
    insights.push({
      id: 'insight-overdue',
      severity: 'critical',
      tab: 'timeline',
      title: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue`,
      detail: `Delayed milestone: "${overdueTasks[0]?.title}". Mark as done or adjust timeline to prevent downstream delays.`,
    });
  }

  // 3. Tasks at risk (Warning)
  const atRiskTasks = schedule.filter((t) => t.isAtRisk && !t.isOverdue);
  if (atRiskTasks.length > 0) {
    insights.push({
      id: 'insight-at-risk',
      severity: 'warning',
      tab: 'timeline',
      title: `${atRiskTasks.length} milestone${atRiskTasks.length > 1 ? 's' : ''} at risk of delay`,
      detail: `Dependencies are pushing finish dates past nominal deadlines. Review timeline graph.`,
    });
  }

  // 4. Critical vendor unbooked with close event date (Warning)
  const venueVendor = plan.vendors.find((v) => v.category === 'venue');
  if (daysToEvent < 90 && (!venueVendor || venueVendor.status !== 'booked')) {
    insights.push({
      id: 'insight-venue-unbooked',
      severity: 'warning',
      tab: 'vendors',
      title: 'Primary venue not yet locked',
      detail: `Event is ${daysToEvent} days away. Booking the venue is critical to freeze caterer logistics and invitation dispatches.`,
    });
  }

  // 5. RSVPs pending (Warning)
  if (daysToEvent < 30 && guests.totalInvitedCount > 0 && guests.confirmationRate < 60) {
    insights.push({
      id: 'insight-rsvp-pending',
      severity: 'warning',
      tab: 'guests',
      title: `${guests.pendingCount} RSVPs still pending confirmation`,
      detail: `Only ${guests.confirmationRate}% confirmed with under a month to go. Send a friendly reminder to freeze the caterer plate count.`,
    });
  }

  // 6. Vendor payment milestones due soon (Suggestion/Warning)
  for (const v of plan.vendors) {
    for (const p of v.payments) {
      if (p.status === 'pending') {
        const daysToPayment = diffDays(today, p.dueDate);
        if (daysToPayment >= 0 && daysToPayment <= 7) {
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
  }

  // 7. General suggestion
  const unquotedCategories = plan.vendors.filter(
    (v) => v.status === 'shortlisted' || v.status === 'contacted',
  );
  if (unquotedCategories.length > 0) {
    insights.push({
      id: 'insight-quotes-needed',
      severity: 'suggestion',
      tab: 'vendors',
      title: `Compare quotes for ${unquotedCategories.length} pending vendor categories`,
      detail: `Collect quotes for ${unquotedCategories
        .map((v) => v.category)
        .slice(0, 3)
        .join(', ')} to turn estimates into verified numbers.`,
    });
  }

  return insights;
}

/**
 * Returns structured textual facts for AI prompting or local Q&A.
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
 * Deterministic local answering engine when AI is offline or API key is not provided.
 */
export function localAnswer(question: string, plan: Plan, today: string): string {
  const q = question.toLowerCase();
  const status = budgetStatus(plan);
  const daysLeft = diffDays(today, plan.eventDate);
  const schedule = buildSchedule(plan.tasks, plan.eventDate, today);
  const guests = aggregateGuests(plan.guestList);

  if (
    q.includes('over budget') ||
    q.includes('budget') ||
    q.includes('kharcha') ||
    q.includes('paisa')
  ) {
    if (status.isOverBudget) {
      return `You are currently over budget by ${formatINR(status.overBy)}. This is because your guest count (${plan.guests}) at ${formatINR(plan.perPlate)}/plate requires more catering than allocated. Please check the Budget tab to apply one of the 3 automated options: trim guests, adjust flexible categories, or use your ${formatINR(status.contingencyLeft)} contingency buffer.`;
    }
    return `Your budget is in good standing! Out of your total ${formatINR(status.total)} budget, ${formatINR(status.committed)} is committed to booked vendors, and you still have ${formatINR(status.total - status.committed)} in remaining buffer and estimates.`;
  }

  if (
    q.includes('next') ||
    q.includes('kya karu') ||
    q.includes('priority') ||
    q.includes('task') ||
    q.includes('due')
  ) {
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

  if (q.includes('guest') || q.includes('rsvp') || q.includes('mehmaan')) {
    if (guests.totalEntries > 0) {
      return `You are planning for ${plan.guests} guests total. From your guest list, you have ${guests.confirmedCount} confirmed (${guests.confirmationRate}%), ${guests.pendingCount} pending, and ${guests.declinedCount} declined. Dietary breakdown: ${guests.byDiet.veg} Veg, ${guests.byDiet.jain} Jain, and ${guests.byDiet.non_veg} Non-Veg.`;
    }
    return `You have set a target headcount of ${plan.guests} guests. Switch to the Guests tab to start adding families and tracking RSVPs with automatic catering recalculation.`;
  }

  if (
    q.includes('vendor') ||
    q.includes('caterer') ||
    q.includes('negotiat') ||
    q.includes('quote')
  ) {
    return `You have ${plan.vendors.filter((v) => v.status === 'booked').length} booked vendors. For unbooked vendors, make sure to ask whether taxes (18% GST) are included, check for minimum plate guarantees, and negotiate advances down to 25%–30%. You can generate instant WhatsApp negotiation messages from the Vendors tab!`;
  }

  return `We have ${daysLeft} days remaining until ${plan.title} on ${plan.eventDate}. Total budget is ${formatINR(status.total)} for ${plan.guests} guests. Open the Overview tab for your action items or ask any specific question about your budget, timeline, guests, or vendors!`;
}
