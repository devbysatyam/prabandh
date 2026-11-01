import { describe, it, expect } from 'vitest';
import { computeCelebrationAnalytics } from '../../src/engine/analytics';
import { allocate } from '../../src/engine/budget';
import type { Plan } from '../../src/schemas';

describe('analytics.ts', () => {
  const plan: Plan = {
    id: 'test-analytics-1',
    version: 1,
    title: 'Aarav 7th Birthday Party',
    occasion: 'kids_birthday',
    eventDate: '2027-01-15',
    totalBudget: 50000,
    guests: 150,
    vibe: 'Superhero themed kids party with games and magic show',
    city: 'New Delhi (Mayur Vihar)',
    priorities: ['decor', 'entertainment', 'catering'],
    priorityKeys: ['decor', 'entertainment', 'catering'],
    allocation: allocate(50000, 'kids_birthday', ['decor', 'entertainment']),
    locked: [],
    contacted: [],
    perPlate: 180,
    tasks: [
      {
        id: 't1',
        title: 'Order Birthday Cake',
        category: 'catering',
        leadDays: 14,
        durationDays: 2,
        dependsOn: [],
        status: 'done',
      },
      {
        id: 't2',
        title: 'Book Magician & Games Host',
        category: 'entertainment',
        leadDays: 21,
        durationDays: 3,
        dependsOn: [],
        status: 'todo',
      },
    ],
    guestList: [
      {
        id: 'g1',
        name: 'Sharma Family',
        count: 4,
        side: 'general',
        rsvp: 'confirmed',
        diet: 'veg',
      },
      {
        id: 'g2',
        name: 'Verma Family',
        count: 3,
        side: 'general',
        rsvp: 'confirmed',
        diet: 'jain',
      },
      {
        id: 'g3',
        name: 'Gupta Family',
        count: 2,
        side: 'general',
        rsvp: 'pending',
        diet: 'non_veg',
      },
    ],
    vendors: [
      { id: 'v1', name: 'Magic Balloon Decor', category: 'decor', status: 'booked', payments: [] },
    ],
    venues: [],
    siteVisits: [
      {
        id: 'sv1',
        venueId: 'ven1',
        venueName: 'Mayur Vihar Club Party Hall',
        visitDate: '2026-11-20',
        attendees: 'Parents',
        rating: 5,
        acWorking: true,
        bridalRoomClean: true,
        soundCurfewOk: true,
        parkingAdequate: true,
        tastingDone: true,
        status: 'completed',
      },
    ],
    quotes: [],
    vendorMeetings: [
      {
        id: 'vm1',
        vendorId: 'v1',
        vendorName: 'Magic Balloon Decor',
        category: 'decor',
        meetingDate: '2026-11-22',
        meetingType: 'decor_mockup',
        attendees: 'Mom & Birthday Boy',
        rating: 5,
        feedback: 'Approved Avengers balloon arch mockup',
        status: 'completed',
      },
    ],
    runSheet: [],
  };

  it('computes per-guest unit economics accurately', () => {
    const analytics = computeCelebrationAnalytics(plan, '2026-11-01');
    // 50,000 / 150 = 333
    expect(analytics.perGuestCost).toBe(333);
    expect(analytics.budgetStatus.total).toBe(50000);
  });

  it('evaluates category allocations against occasion benchmarks', () => {
    const analytics = computeCelebrationAnalytics(plan, '2026-11-01');
    expect(analytics.categories.length).toBe(7);
    const decorCat = analytics.categories.find((c) => c.category === 'decor');
    expect(decorCat).toBeDefined();
    expect(decorCat?.allocatedRupees).toBeGreaterThan(0);
  });

  it('aggregates site visits and vendor tasting scores', () => {
    const analytics = computeCelebrationAnalytics(plan, '2026-11-01');
    expect(analytics.siteVisitsCompleted).toBe(1);
    expect(analytics.siteVisitsAvgRating).toBe(5);
    expect(analytics.vendorTastingsCompleted).toBe(1);
    expect(analytics.vendorTastingsAvgRating).toBe(5);
  });

  it('evaluates guest dietary distribution', () => {
    const analytics = computeCelebrationAnalytics(plan, '2026-11-01');
    expect(analytics.guestSummary.totalInvitedCount).toBe(9);
    expect(analytics.guestSummary.byDiet.veg).toBe(4);
    expect(analytics.guestSummary.byDiet.jain).toBe(3);
    expect(analytics.guestSummary.byDiet.non_veg).toBe(2);
  });

  it('computes 4-pillar readiness score and tier', () => {
    const analytics = computeCelebrationAnalytics(plan, '2026-11-01');
    expect(analytics.readiness.totalScore).toBeGreaterThanOrEqual(60);
    expect(['excellent', 'on_track', 'needs_attention', 'critical']).toContain(
      analytics.readiness.tier,
    );
    expect(analytics.keyActionRecommendations.length).toBeGreaterThan(0);
  });
});
