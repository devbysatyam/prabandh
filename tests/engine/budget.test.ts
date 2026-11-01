import { describe, it, expect } from 'vitest';
import {
  allocate,
  redistribute,
  scaleGuests,
  budgetStatus,
  generateOverBudgetOptions,
  applyOption,
} from '../../src/engine/budget';
import { CATEGORIES, type Plan } from '../../src/schemas';

describe('budget.ts', () => {
  const basePlan: Plan = {
    id: 'test-plan',
    version: 1,
    title: 'Test Shaadi',
    occasion: 'wedding',
    eventDate: '2026-12-15',
    totalBudget: 1000000,
    guests: 200,
    vibe: 'Royal',
    priorities: ['catering'],
    priorityKeys: [],
    allocation: allocate(1000000, 'wedding', ['catering']),
    locked: [],
    contacted: [],
    perPlate: 1750,
    tasks: [],
    guestList: [],
    vendors: [],
    venues: [],
    siteVisits: [],
    quotes: [],
    vendorMeetings: [],
    runSheet: [],
  };

  it('allocates budget exactly matching target total with 10% contingency', () => {
    const alloc = allocate(1000000, 'wedding', ['catering']);
    const sum = CATEGORIES.reduce((s, c) => s + alloc[c], 0);

    expect(sum).toBe(1000000);
    expect(alloc.contingency).toBe(100000); // 10% of 10L
    expect(alloc.catering).toBeGreaterThan(alloc.venue); // boosted by ×1.25 priority
  });

  it('redistributes deltas across unlocked categories while keeping exact sum', () => {
    const initialAlloc = allocate(1000000, 'wedding');
    const oldDecor = initialAlloc.decor;

    // Increase photography by 50,000 with venue locked
    const result = redistribute(initialAlloc, 'photography', initialAlloc.photography + 50000, [
      'venue',
    ]);
    const newSum = CATEGORIES.reduce((s, c) => s + result.allocation[c], 0);

    expect(newSum).toBe(1000000);
    expect(result.allocation.venue).toBe(initialAlloc.venue); // locked, did not change
    expect(result.allocation.decor).toBeLessThan(oldDecor); // absorbed delta
    expect(result.capped).toBe(false);
  });

  it('caps redistribution when pool cannot absorb huge increase', () => {
    const initialAlloc = allocate(1000000, 'wedding');
    const result = redistribute(initialAlloc, 'photography', 5000000, [
      'venue',
      'catering',
      'decor',
    ]);

    expect(result.capped).toBe(true);
    const newSum = CATEGORIES.reduce((s, c) => s + result.allocation[c], 0);
    expect(newSum).toBe(1000000);
  });

  it('scales guests and identifies over-budget condition', () => {
    // 200 guests at 1750 = 350,000 required catering
    const scaling = scaleGuests(basePlan, 300); // 300 * 1750 = 525,000 required
    expect(scaling.requiredCatering).toBe(525000);
    expect(scaling.isOverBudget).toBe(true);
    expect(scaling.difference).toBeGreaterThan(0);
  });

  it('computes budget status correctly', () => {
    const status = budgetStatus(basePlan);
    expect(status.total).toBe(1000000);
    expect(status.contingencyLeft).toBe(basePlan.allocation.contingency);
  });

  it('generates over-budget options and applies them cleanly', () => {
    // Force over-budget state by setting high guests
    const overPlan: Plan = {
      ...basePlan,
      guests: 260, // 260 * 1750 = 455,000 catering required
    };

    const options = generateOverBudgetOptions(overPlan);
    expect(options.length).toBeGreaterThan(0);

    // Apply contingency option
    const contOption = options.find((o) => o.id === 'use_contingency');
    if (contOption) {
      const fixed = applyOption(overPlan, 'use_contingency');
      expect(fixed.allocation.catering).toBeGreaterThan(overPlan.allocation.catering);
      expect(fixed.allocation.contingency).toBeLessThan(overPlan.allocation.contingency);
    }

    // Apply guest trim option
    const guestOption = options.find((o) => o.id === 'reduce_guests');
    if (guestOption) {
      const fixed = applyOption(overPlan, 'reduce_guests');
      expect(fixed.guests).toBeLessThan(overPlan.guests);
    }
  });
});
