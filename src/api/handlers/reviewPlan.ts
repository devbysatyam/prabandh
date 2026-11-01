import { PlanReviewSchema, type PlanReview } from '../../schemas';
import { planInsights } from '../../engine/advisor';
import type { RequestBody } from '../security';
import type { ApiResponse } from '../types';

const BASE_HEALTH = 100;
const MIN_HEALTH = 15;
const CRITICAL_PENALTY = 20;
const WARNING_PENALTY = 8;
const TOP_ITEMS = 3;

/** POST /api/review-plan: deterministic plan health score and top risks. */
export function handleReviewPlan(body: RequestBody<'review-plan'>): Promise<ApiResponse> {
  const today = body.today ?? new Date().toISOString().slice(0, 10);
  const insights = planInsights(body.plan, today);
  const critical = insights.filter((i) => i.severity === 'critical').length;
  const warnings = insights.filter((i) => i.severity === 'warning').length;
  const healthScore = Math.max(
    MIN_HEALTH,
    Math.min(BASE_HEALTH, BASE_HEALTH - critical * CRITICAL_PENALTY - warnings * WARNING_PENALTY),
  );
  const top = insights.slice(0, TOP_ITEMS);

  const review: PlanReview = {
    summary:
      critical > 0
        ? `Your plan requires immediate attention on ${critical} critical items (budget & deadlines). Addressing these now will keep your event stress-free.`
        : `Your celebration plan is in good shape with a health score of ${healthScore}%. Follow up on pending vendor milestones to stay ahead.`,
    healthScore,
    topRisks: top.map((i) => `${i.title}: ${i.detail}`),
    recommendedActions: top.map((i) => ({
      title: i.title,
      description: i.detail,
      impact: i.severity === 'critical' ? 'high' : 'medium',
    })),
  };

  const parsed = PlanReviewSchema.safeParse(review);
  return Promise.resolve({ status: 200, data: parsed.success ? parsed.data : review });
}
