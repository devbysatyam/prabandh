import { describe, it, expect } from 'vitest';
import { planInsights, planFacts, localAnswer } from '../../src/engine/advisor';
import { allocate } from '../../src/engine/budget';
import type { Plan } from '../../src/schemas';

describe('advisor.ts', () => {
  const plan: Plan = {
    id: 'p1',
    version: 1,
    title: 'Pune Shaadi',
    occasion: 'wedding',
    eventDate: '2026-12-25',
    totalBudget: 1000000,
    guests: 200,
    vibe: 'Traditional',
    city: 'Pune',
    priorities: ['catering'],
    priorityKeys: [],
    allocation: allocate(1000000, 'wedding'),
    locked: [],
    contacted: [],
    perPlate: 1750,
    tasks: [
      {
        id: '1',
        title: 'Lock Venue',
        category: 'venue',
        leadDays: 90,
        durationDays: 7,
        dependsOn: [],
        status: 'todo',
      },
    ],
    guestList: [
      { id: 'g1', name: 'Sharma', count: 4, side: 'bride', rsvp: 'confirmed', diet: 'veg' },
    ],
    vendors: [],
    venues: [],
    siteVisits: [],
    quotes: [],
    vendorMeetings: [],
    runSheet: [],
  };

  it('generates ranked insights across budget, timeline and vendors', () => {
    const insights = planInsights(plan, '2026-10-01');
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every((i) => ['critical', 'warning', 'suggestion'].includes(i.severity))).toBe(
      true,
    );
  });

  it('formats verified plan facts string for prompting or local review', () => {
    const facts = planFacts(plan, '2026-10-01');
    expect(facts).toContain('Title: Pune Shaadi');
    expect(facts).toContain('Occasion: wedding');
    expect(facts).toContain('Pune');
    expect(facts).toContain('Guests: 200');
  });

  it('answers family questions using deterministic local logic', () => {
    const ans1 = localAnswer('Are we over budget?', plan, '2026-10-01');
    expect(ans1).toContain('budget');

    const ans2 = localAnswer('What should I do next?', plan, '2026-10-01');
    expect(ans2).toContain('priority');

    const ans3 = localAnswer('Tell me about the guests and rsvps', plan, '2026-10-01');
    expect(ans3).toContain('guests');

    const ans4 = localAnswer('How do I negotiate with vendors?', plan, '2026-10-01');
    expect(ans4).toContain('vendor');
  });
});
