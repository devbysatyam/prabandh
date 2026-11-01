import type { Category, Plan } from '../schemas';
import { CATEGORIES } from '../schemas';
import { budgetStatus, type BudgetStatus } from './budget';
import { aggregateGuests, type GuestSummary } from './guests';
import { buildSchedule, diffDays } from './timeline';
import { OCCASION_PRESETS } from './presets';
import { formatINR } from './money';

/**
 * Allocation of one budget category compared with the occasion benchmark.
 *
 * @example
 * ```ts
 * const c: CategoryAnalytics = {
 *   category: 'catering',
 *   allocatedRupees: 450000,
 *   allocatedPct: 30,
 *   benchmarkPct: 35,
 *   variancePct: -5,
 *   status: 'balanced',
 * };
 * ```
 */
export interface CategoryAnalytics {
  category: Category;
  allocatedRupees: number;
  allocatedPct: number;
  benchmarkPct: number;
  variancePct: number;
  status: 'balanced' | 'heavy' | 'lean';
}

/**
 * Four-pillar readiness score (budget, timeline, vendors, guests; 25 points each).
 *
 * @example
 * ```ts
 * readiness.totalScore; // => 0..100
 * readiness.tier; // => 'excellent' | 'on_track' | 'needs_attention' | 'critical'
 * ```
 */
export interface ReadinessScoreBreakdown {
  budgetScore: number; // 0-25
  timelineScore: number; // 0-25
  vendorScore: number; // 0-25
  guestScore: number; // 0-25
  totalScore: number; // 0-100
  tier: 'excellent' | 'on_track' | 'needs_attention' | 'critical';
}

/**
 * Full analytics snapshot returned by {@link computeCelebrationAnalytics}.
 *
 * @example
 * ```ts
 * const a = computeCelebrationAnalytics(plan, today);
 * a.readiness.totalScore;
 * ```
 */
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

/** Round to one decimal place. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Average rating (default 4 for unrated) of completed entries, one decimal; 0 when none. */
function averageRating(entries: { status: string; rating?: number | undefined }[]): {
  count: number;
  avg: number;
} {
  const completed = entries.filter((e) => e.status === 'completed');
  if (completed.length === 0) return { count: 0, avg: 0 };
  const total = completed.reduce((acc, e) => acc + (e.rating || 4), 0);
  return { count: completed.length, avg: round1(total / completed.length) };
}

/** Compare each category's allocation with the occasion benchmark. */
function categoryAnalytics(plan: Plan, total: number): CategoryAnalytics[] {
  const preset = OCCASION_PRESETS[plan.occasion] ?? OCCASION_PRESETS.wedding;
  return CATEGORIES.map((cat) => {
    const allocatedRupees = plan.allocation[cat] ?? 0;
    const allocatedPct = total > 0 ? (allocatedRupees / total) * 100 : 0;
    const benchmarkPct = preset[cat] ?? 10;
    const variancePct = round1(allocatedPct - benchmarkPct);
    let status: CategoryAnalytics['status'] = 'balanced';
    if (variancePct > 6) status = 'heavy';
    else if (variancePct < -6) status = 'lean';
    return {
      category: cat,
      allocatedRupees,
      allocatedPct: round1(allocatedPct),
      benchmarkPct,
      variancePct,
      status,
    };
  });
}

/** Budget pillar (0-25): penalises overspend and an exhausted buffer. */
function scoreBudget(b: BudgetStatus): number {
  if (b.isOverBudget) {
    const deficitRatio = b.overBy / Math.max(1, b.total);
    return Math.max(0, Math.round(25 - deficitRatio * 50));
  }
  return b.committed > b.total * 0.95 ? 20 : 25;
}

/** Vendor pillar (0-25): booked vendors, completed site visits and tastings. */
function scoreVendors(bookedCount: number, siteVisits: number, tastings: number): number {
  let score = 15;
  if (bookedCount >= 3) score += 5;
  if (siteVisits > 0) score += 3;
  if (tastings > 0) score += 2;
  return Math.min(25, score);
}

/** Guest pillar (0-25): RSVP confirmation rate. */
function scoreGuests(g: GuestSummary): number {
  if (g.totalEntries === 0) return 15;
  if (g.confirmationRate >= 70) return 25;
  return g.confirmationRate >= 40 ? 20 : 18;
}

/** Map a 0-100 total score to its readiness tier. */
function readinessTier(totalScore: number): ReadinessScoreBreakdown['tier'] {
  if (totalScore < 50) return 'critical';
  if (totalScore < 70) return 'needs_attention';
  return totalScore < 85 ? 'on_track' : 'excellent';
}

/** Inputs to the next-best-action recommendation list. */
interface RecommendationInput {
  plan: Plan;
  budget: BudgetStatus;
  guests: GuestSummary;
  overdueTitles: string[];
  siteVisitsCompleted: number;
  vendorTastingsCompleted: number;
}

/** Plain-language next steps derived from the analytics inputs (never empty). */
function buildRecommendations(i: RecommendationInput): string[] {
  const recs: string[] = [];
  if (i.budget.isOverBudget) {
    recs.push(
      `Budget deficit of ${formatINR(i.budget.overBy)}: use the Connected Budget solver to scale guest count or absorb via flexible categories.`,
    );
  }
  if (i.overdueTitles.length > 0) {
    recs.push(
      `${i.overdueTitles.length} milestone tasks are overdue (${i.overdueTitles
        .slice(0, 2)
        .join(', ')}). Prioritize closing them this week.`,
    );
  }
  if (i.siteVisitsCompleted === 0) {
    recs.push(
      'Schedule an in-person physical site recce to verify AC cooling, green room hygiene, and sound curfew.',
    );
  }
  if (i.vendorTastingsCompleted === 0 && i.plan.occasion === 'wedding') {
    recs.push(
      'Log an in-person food tasting session with caterers to calibrate spice levels and approve live counter menus.',
    );
  }
  if (i.guests.totalEntries === 0) {
    recs.push(
      'Add family contacts into the Guest List to enable automatic headcount sync and 1-click WhatsApp invites.',
    );
  } else if (i.guests.pendingCount > 0) {
    recs.push(
      `Follow up on ${i.guests.pendingCount} pending RSVPs to lock the final plate guarantee and prevent catering food waste.`,
    );
  }
  if (recs.length === 0) {
    recs.push(
      'All celebration parameters are well-balanced and on schedule. Review your day-of run sheet coordinators.',
    );
  }
  return recs;
}

/**
 * Computes celebration analytics across financials, guest pacing,
 * vendor readiness and timeline execution health.
 *
 * @param plan - The current plan.
 * @param today - Reference date (YYYY-MM-DD).
 * @returns Per-guest cost, readiness scores, category benchmarks, visit / tasting ratings and recommendations.
 * @example
 * ```ts
 * const a = computeCelebrationAnalytics(plan, '2026-11-02');
 * a.keyActionRecommendations[0]; // => 'Schedule an in-person physical site recce ...'
 * ```
 */
export function computeCelebrationAnalytics(plan: Plan, today: string): CelebrationAnalytics {
  const bStatus = budgetStatus(plan);
  const gSummary = aggregateGuests(plan.guestList);
  const schedule = buildSchedule(plan.tasks, plan.eventDate, today);
  const overdueTasks = schedule.filter((t) => t.isOverdue);

  const visits = averageRating(plan.siteVisits ?? []);
  const tastings = averageRating(plan.vendorMeetings ?? []);
  const bookedCount = plan.vendors.filter((v) => v.status === 'booked').length;

  const budgetScore = scoreBudget(bStatus);
  const timelineScore = overdueTasks.length > 0 ? Math.max(5, 25 - overdueTasks.length * 5) : 25;
  const vendorScore = scoreVendors(bookedCount, visits.count, tastings.count);
  const guestScore = scoreGuests(gSummary);
  const totalScore = budgetScore + timelineScore + vendorScore + guestScore;

  return {
    perGuestCost: Math.round(plan.totalBudget / Math.max(1, plan.guests)),
    budgetStatus: bStatus,
    guestSummary: gSummary,
    readiness: {
      budgetScore,
      timelineScore,
      vendorScore,
      guestScore,
      totalScore,
      tier: readinessTier(totalScore),
    },
    categories: categoryAnalytics(plan, bStatus.total),
    siteVisitsCompleted: visits.count,
    siteVisitsAvgRating: visits.avg,
    vendorTastingsCompleted: tastings.count,
    vendorTastingsAvgRating: tastings.avg,
    overdueTasksCount: overdueTasks.length,
    daysRemaining: Math.max(0, diffDays(today, plan.eventDate)),
    keyActionRecommendations: buildRecommendations({
      plan,
      budget: bStatus,
      guests: gSummary,
      overdueTitles: overdueTasks.map((t) => t.title),
      siteVisitsCompleted: visits.count,
      vendorTastingsCompleted: tastings.count,
    }),
  };
}
