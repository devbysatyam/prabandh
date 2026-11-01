import { describe, it, expect } from 'vitest';
import { createSamplePlan } from '../../src/state/planStore';
import { budgetStatus } from '../../src/engine/budget';
import { computeCelebrationAnalytics } from '../../src/engine/analytics';

describe('UI State & Analytics Integration', () => {
  it('initializes interactive sample celebration with valid linked state', () => {
    const plan = createSamplePlan();
    expect(plan.title).toContain('Sharma & Verma');
    expect(plan.totalBudget).toBe(1500000);
    expect(plan.guests).toBe(200);

    const status = budgetStatus(plan);
    expect(status.total).toBe(1500000);
    expect(status.contingencyLeft).toBe(150000); // exactly 10%
    expect(status.isOverBudget).toBe(false);
  });

  it('computes complete analytics for sample celebration plan', () => {
    const plan = createSamplePlan();
    const analytics = computeCelebrationAnalytics(plan, '2026-11-01');

    expect(analytics.perGuestCost).toBe(7500); // 15L / 200 = 7,500
    expect(analytics.readiness.totalScore).toBeGreaterThanOrEqual(70);
    expect(analytics.siteVisitsCompleted).toBeGreaterThanOrEqual(1);
    expect(analytics.vendorTastingsCompleted).toBeGreaterThanOrEqual(1);
    expect(analytics.categories.length).toBe(7);
  });
});
