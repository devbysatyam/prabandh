import type { Category, Plan } from '../schemas';
import { CATEGORIES } from '../schemas';
import { budgetStatus, type BudgetStatus } from './budget';
import { aggregateGuests, type GuestSummary } from './guests';
import { buildSchedule, diffDays } from './timeline';
import { OCCASION_PRESETS } from './presets';
import { formatINR } from './money';

export interface CategoryAnalytics {
  category: Category;
  allocatedRupees: number;
  allocatedPct: number;
  benchmarkPct: number;
  variancePct: number;
  status: 'balanced' | 'heavy' | 'lean';
}

export interface ReadinessScoreBreakdown {
  budgetScore: number; // 0-25
  timelineScore: number; // 0-25
  vendorScore: number; // 0-25
  guestScore: number; // 0-25
  totalScore: number; // 0-100
  tier: 'excellent' | 'on_track' | 'needs_attention' | 'critical';
}

export interface CelebrationAnalytics {
  perGuestCost: number;
  budgetStatus: BudgetStatus;
  guestSummary: GuestSummary;
  readiness: ReadinessScoreBreakdown;
  categories: CategoryAnalytics[];
  siteVisitsCompleted: number;
  siteVisitsAvgRating: number;
  vendorTastingsCompleted: number;
  vendorTastingsAvgRating: number;
  overdueTasksCount: number;
  daysRemaining: number;
  keyActionRecommendations: string[];
}

/**
 * Computes deep celebration analytics across financials, guest pacing,
 * vendor readiness, and timeline execution health.
 */
export function computeCelebrationAnalytics(plan: Plan, today: string): CelebrationAnalytics {
  const bStatus = budgetStatus(plan);
  const gSummary = aggregateGuests(plan.guestList);
  const schedule = buildSchedule(plan.tasks, plan.eventDate, today);
  const overdueTasks = schedule.filter((t) => t.isOverdue);
  const daysRemaining = Math.max(0, diffDays(today, plan.eventDate));

  // Per guest financial metric
  const perGuestCost = Math.round(plan.totalBudget / Math.max(1, plan.guests));

  // Category variance vs occasion benchmark
  const preset = OCCASION_PRESETS[plan.occasion] ?? OCCASION_PRESETS.wedding;
  const categories: CategoryAnalytics[] = CATEGORIES.map((cat) => {
    const allocatedRupees = plan.allocation[cat] ?? 0;
    const allocatedPct = bStatus.total > 0 ? (allocatedRupees / bStatus.total) * 100 : 0;
    const benchmarkPct = preset[cat] ?? 10;
    const variancePct = Math.round((allocatedPct - benchmarkPct) * 10) / 10;

    let status: 'balanced' | 'heavy' | 'lean' = 'balanced';
    if (variancePct > 6) status = 'heavy';
    else if (variancePct < -6) status = 'lean';

    return {
      category: cat,
      allocatedRupees,
      allocatedPct: Math.round(allocatedPct * 10) / 10,
      benchmarkPct,
      variancePct,
      status,
    };
  });

  // Site visits & Vendor meetings analytics
  const completedVisits = (plan.siteVisits ?? []).filter((v) => v.status === 'completed');
  const siteVisitsCompleted = completedVisits.length;
  const siteVisitsAvgRating =
    siteVisitsCompleted > 0
      ? Math.round(
          (completedVisits.reduce((acc, v) => acc + (v.rating || 4), 0) / siteVisitsCompleted) * 10,
        ) / 10
      : 0;

  const completedTastings = (plan.vendorMeetings ?? []).filter((m) => m.status === 'completed');
  const vendorTastingsCompleted = completedTastings.length;
  const vendorTastingsAvgRating =
    vendorTastingsCompleted > 0
      ? Math.round(
          (completedTastings.reduce((acc, m) => acc + (m.rating || 4), 0) /
            vendorTastingsCompleted) *
            10,
        ) / 10
      : 0;

  // 1. Budget Score (0-25)
  let budgetScore = 25;
  if (bStatus.isOverBudget) {
    const deficitRatio = bStatus.overBy / Math.max(1, bStatus.total);
    budgetScore = Math.max(0, Math.round(25 - deficitRatio * 50));
  } else if (bStatus.committed > bStatus.total * 0.95) {
    budgetScore = 20; // almost out of buffer
  }

  // 2. Timeline Score (0-25)
  let timelineScore = 25;
  if (overdueTasks.length > 0) {
    timelineScore = Math.max(5, 25 - overdueTasks.length * 5);
  }

  // 3. Vendor Score (0-25)
  const bookedCount = plan.vendors.filter((v) => v.status === 'booked').length;
  let vendorScore = 15;
  if (bookedCount >= 3) vendorScore += 5;
  if (siteVisitsCompleted > 0) vendorScore += 3;
  if (vendorTastingsCompleted > 0) vendorScore += 2;
  vendorScore = Math.min(25, vendorScore);

  // 4. Guest Score (0-25)
  let guestScore = 15;
  if (gSummary.totalEntries > 0) {
    if (gSummary.confirmationRate >= 70) guestScore = 25;
    else if (gSummary.confirmationRate >= 40) guestScore = 20;
    else guestScore = 18;
  }

  const totalScore = budgetScore + timelineScore + vendorScore + guestScore;

  let tier: ReadinessScoreBreakdown['tier'] = 'excellent';
  if (totalScore < 50) tier = 'critical';
  else if (totalScore < 70) tier = 'needs_attention';
  else if (totalScore < 85) tier = 'on_track';

  const readiness: ReadinessScoreBreakdown = {
    budgetScore,
    timelineScore,
    vendorScore,
    guestScore,
    totalScore,
    tier,
  };

  // Action recommendations
  const keyActionRecommendations: string[] = [];

  if (bStatus.isOverBudget) {
    keyActionRecommendations.push(
      `Budget deficit of ${formatINR(bStatus.overBy)}: use the Connected Budget solver to scale guest count or absorb via flexible categories.`,
    );
  }

  if (overdueTasks.length > 0) {
    keyActionRecommendations.push(
      `${overdueTasks.length} milestone tasks are overdue (${overdueTasks
        .map((t) => t.title)
        .slice(0, 2)
        .join(', ')}). Prioritize closing them this week.`,
    );
  }

  if (siteVisitsCompleted === 0) {
    keyActionRecommendations.push(
      'Schedule an in-person physical site recce to verify AC cooling, green room hygiene, and sound curfew.',
    );
  }

  if (vendorTastingsCompleted === 0 && plan.occasion === 'wedding') {
    keyActionRecommendations.push(
      'Log an in-person food tasting session with caterers to calibrate spice levels and approve live counter menus.',
    );
  }

  if (gSummary.totalEntries === 0) {
    keyActionRecommendations.push(
      'Add family contacts into the Guest List to enable automatic headcount sync and 1-click WhatsApp invites.',
    );
  } else if (gSummary.pendingCount > 0) {
    keyActionRecommendations.push(
      `Follow up on ${gSummary.pendingCount} pending RSVPs to lock the final plate guarantee and prevent catering food waste.`,
    );
  }

  if (keyActionRecommendations.length === 0) {
    keyActionRecommendations.push(
      'All celebration parameters are well-balanced and on schedule. Review your day-of run sheet coordinators.',
    );
  }

  return {
    perGuestCost,
    budgetStatus: bStatus,
    guestSummary: gSummary,
    readiness,
    categories,
    siteVisitsCompleted,
    siteVisitsAvgRating,
    vendorTastingsCompleted,
    vendorTastingsAvgRating,
    overdueTasksCount: overdueTasks.length,
    daysRemaining,
    keyActionRecommendations,
  };
}
