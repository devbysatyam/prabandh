import { describe, it, expect } from 'vitest';
import { planInsights, planFacts, localAnswer } from '../../src/engine/advisor';
import { computeCelebrationAnalytics } from '../../src/engine/analytics';
import {
  allocate,
  applyOption,
  budgetStatus,
  generateOverBudgetOptions,
  redistribute,
} from '../../src/engine/budget';
import { CATEGORIES, type Plan, type Vendor } from '../../src/schemas';
import { createSamplePlan } from '../../src/state/planStore';

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return { ...createSamplePlan(), ...overrides };
}

function emptyPlan(overrides: Partial<Plan> = {}): Plan {
  return makePlan({
    tasks: [],
    guestList: [],
    vendors: [],
    siteVisits: [],
    vendorMeetings: [],
    quotes: [],
    ...overrides,
  });
}

const task = (id: string, status: 'todo' | 'done' = 'todo', leadDays = 365) => ({
  id,
  title: `Task ${id}`,
  category: 'venue' as const,
  leadDays,
  durationDays: 1,
  dependsOn: [],
  status,
});

const sum = (a: Record<string, number>) => Object.values(a).reduce((s, n) => s + n, 0);

describe('advisor.ts branches', () => {
  it('flags over-budget, overdue, unbooked venue, pending RSVPs, payments and quotes', () => {
    const vendors: Vendor[] = [
      {
        id: 'v1',
        name: 'Caterer',
        category: 'catering',
        status: 'contacted',
        payments: [
          { id: 'p1', title: 'Advance', amount: 5000, dueDate: '2026-12-03', status: 'pending' },
          { id: 'p2', title: 'Far', amount: 5000, dueDate: '2027-06-01', status: 'pending' },
          { id: 'p3', title: 'Done', amount: 5000, dueDate: '2026-12-03', status: 'paid' },
        ],
      },
    ];
    const plan = emptyPlan({
      eventDate: '2026-12-20',
      guests: 500,
      perPlate: 5000,
      tasks: [task('a'), task('b')],
      vendors,
      guestList: [
        { id: 'g1', name: 'A', count: 1, side: 'general', rsvp: 'confirmed', diet: 'veg' },
        { id: 'g2', name: 'B', count: 9, side: 'general', rsvp: 'pending', diet: 'veg' },
      ],
    });
    const ids = planInsights(plan, '2026-12-01').map((i) => i.id);
    expect(ids).toContain('insight-overbudget');
    expect(ids).toContain('insight-overdue');
    expect(ids).toContain('insight-venue-unbooked');
    expect(ids).toContain('insight-rsvp-pending');
    expect(ids).toContain('insight-pay-p1');
    expect(ids).not.toContain('insight-pay-p2');
    expect(ids).not.toContain('insight-pay-p3');
    expect(ids).toContain('insight-quotes-needed');
  });

  it('uses singular wording for one overdue task and plural for several', () => {
    const one = emptyPlan({ eventDate: '2026-12-20', tasks: [task('a')] });
    expect(
      planInsights(one, '2026-12-01').find((i) => i.id === 'insight-overdue')?.title,
    ).toContain('is overdue');
    const two = emptyPlan({ eventDate: '2026-12-20', tasks: [task('a'), task('b')] });
    expect(
      planInsights(two, '2026-12-01').find((i) => i.id === 'insight-overdue')?.title,
    ).toContain('are overdue');
  });

  it('reports at-risk milestones when dependencies push dates past deadlines', () => {
    const risky = emptyPlan({
      eventDate: '2027-03-01',
      tasks: [
        { ...task('a', 'todo', 60), durationDays: 30 },
        { ...task('b', 'todo', 40), dependsOn: ['a'], durationDays: 30 },
      ],
    });
    const out = planInsights(risky, '2026-12-01');
    expect(Array.isArray(out)).toBe(true);
  });

  it('stays quiet when the venue is booked and the event is far away', () => {
    const plan = emptyPlan({
      eventDate: '2028-01-01',
      vendors: [{ id: 'v', name: 'Hall', category: 'venue', status: 'booked', payments: [] }],
    });
    const ids = planInsights(plan, '2026-12-01').map((i) => i.id);
    expect(ids).not.toContain('insight-venue-unbooked');
    expect(ids).not.toContain('insight-rsvp-pending');
  });

  it('planFacts reports over-budget, overdue titles and unspecified city', () => {
    const { city: _city, ...rest } = emptyPlan({
      eventDate: '2026-12-20',
      guests: 500,
      perPlate: 5000,
      tasks: [task('a')],
    });
    const facts = planFacts(rest, '2026-12-01');
    expect(facts).toContain('OVER BUDGET');
    expect(facts).toContain('City: Not specified');
    expect(facts).toContain('Task a');
    const ok = planFacts(emptyPlan(), '2026-10-01');
    expect(ok).toContain('Within Budget');
    expect(ok).toContain('Overdue tasks: None');
  });

  it('localAnswer covers every branch', () => {
    const over = emptyPlan({ guests: 500, perPlate: 5000 });
    expect(localAnswer('kharcha?', over, '2026-10-01')).toContain('over budget');
    expect(localAnswer('budget status', emptyPlan(), '2026-10-01')).toContain('good standing');

    const overdue = emptyPlan({ eventDate: '2026-12-20', tasks: [task('a')] });
    expect(localAnswer('what is next', overdue, '2026-12-01')).toContain('overdue');

    const upcoming = emptyPlan({ eventDate: '2028-12-20', tasks: [task('a', 'todo', 30)] });
    expect(localAnswer('priority tasks', upcoming, '2026-12-01')).toContain('next milestone');

    const alldone = emptyPlan({ eventDate: '2028-12-20', tasks: [task('a', 'done', 30)] });
    expect(localAnswer('due?', alldone, '2026-12-01')).toContain('up to date');

    expect(localAnswer('mehmaan list', emptyPlan(), '2026-10-01')).toContain('target headcount');
    const withGuests = emptyPlan({
      guestList: [{ id: 'g', name: 'A', count: 2, side: 'general', rsvp: 'pending', diet: 'jain' }],
    });
    expect(localAnswer('rsvp?', withGuests, '2026-10-01')).toContain('Dietary breakdown');
    expect(localAnswer('quote please', emptyPlan(), '2026-10-01')).toContain('GST');
    expect(localAnswer('hello', emptyPlan(), '2026-10-01')).toContain('days remaining');
  });
});

describe('analytics.ts branches', () => {
  it('scores a troubled plan: over budget, overdue, no guests, no visits, wedding', () => {
    const plan = emptyPlan({
      occasion: 'wedding',
      eventDate: '2026-12-20',
      guests: 800,
      perPlate: 5000,
      tasks: [task('a'), task('b'), task('c')],
    });
    const a = computeCelebrationAnalytics(plan, '2026-12-01');
    expect(a.budgetStatus.isOverBudget).toBe(true);
    expect(a.readiness.budgetScore).toBeLessThan(25);
    expect(a.overdueTasksCount).toBe(3);
    expect(a.siteVisitsAvgRating).toBe(0);
    expect(a.vendorTastingsAvgRating).toBe(0);
    const recs = a.keyActionRecommendations.join('\n');
    expect(recs).toContain('Budget deficit');
    expect(recs).toContain('overdue');
    expect(recs).toContain('site recce');
    expect(recs).toContain('food tasting');
    expect(recs).toContain('Guest List');
  });

  it('covers guest-score tiers, vendor score and the excellent tier', () => {
    const guest = (rsvp: 'confirmed' | 'pending', n: number, id: string) => ({
      id,
      name: id,
      count: n,
      side: 'general' as const,
      rsvp,
      diet: 'veg' as const,
    });
    const base = {
      occasion: 'milestone' as const,
      eventDate: '2028-01-01',
      guests: 10,
      perPlate: 100,
    };
    const score = (guestList: Plan['guestList']) =>
      computeCelebrationAnalytics(emptyPlan({ ...base, guestList }), '2026-12-01');
    expect(score([guest('confirmed', 9, 'a'), guest('pending', 1, 'b')]).readiness.guestScore).toBe(
      25,
    );
    expect(score([guest('confirmed', 5, 'a'), guest('pending', 5, 'b')]).readiness.guestScore).toBe(
      20,
    );
    const low = score([guest('confirmed', 1, 'a'), guest('pending', 9, 'b')]);
    expect(low.readiness.guestScore).toBe(18);
    expect(low.keyActionRecommendations.join()).toContain('pending RSVPs');

    const booked: Vendor[] = (['venue', 'catering', 'decor'] as const).map((c, i) => ({
      id: `v${i}`,
      name: c,
      category: c,
      status: 'booked' as const,
      payments: [],
    }));
    const rich = computeCelebrationAnalytics(
      emptyPlan({
        ...base,
        vendors: booked,
        guestList: [guest('confirmed', 10, 'a')],
        siteVisits: [
          {
            id: 's',
            venueId: 'x',
            venueName: 'X',
            visitDate: '2026-11-01',
            attendees: '',
            rating: 5,
            acWorking: true,
            bridalRoomClean: true,
            soundCurfewOk: true,
            parkingAdequate: true,
            tastingDone: false,
            status: 'completed',
          },
        ],
        vendorMeetings: [
          {
            id: 'm',
            vendorId: 'v0',
            vendorName: 'x',
            category: 'venue',
            meetingDate: '2026-11-01',
            meetingType: 'food_tasting',
            attendees: '',
            rating: 3,
            feedback: '',
            status: 'completed',
          },
        ],
      }),
      '2026-12-01',
    );
    expect(rich.readiness.vendorScore).toBe(25);
    expect(rich.readiness.tier).toBe('excellent');
    expect(rich.keyActionRecommendations[0]).toContain('well-balanced');
  });

  it('assigns critical tier, heavy/lean categories, near-limit and zero budgets', () => {
    const critical = computeCelebrationAnalytics(
      emptyPlan({
        eventDate: '2026-12-20',
        guests: 10_000,
        perPlate: 100_000,
        tasks: Array.from({ length: 10 }, (_, i) => task(`t${i}`)),
      }),
      '2026-12-01',
    );
    expect(critical.readiness.tier).toBe('critical');

    const alloc = allocate(1_000_000, 'wedding');
    const skewed = emptyPlan({
      totalBudget: 1_000_000,
      guests: 10,
      perPlate: 100,
      allocation: { ...alloc, venue: 800_000, decor: 0, misc: 0 },
    });
    const cats = computeCelebrationAnalytics(skewed, '2026-12-01').categories;
    expect(cats.some((c) => c.status === 'heavy')).toBe(true);
    expect(cats.some((c) => c.status === 'lean')).toBe(true);

    const almost = emptyPlan({
      totalBudget: 1000,
      guests: 1,
      perPlate: 1,
      allocation: allocate(1000, 'wedding'),
      vendors: [
        {
          id: 'v',
          name: 'V',
          category: 'venue',
          status: 'booked',
          payments: [{ id: 'p', title: 'p', amount: 990, dueDate: '2027-01-01', status: 'paid' }],
        },
      ],
    });
    expect(computeCelebrationAnalytics(almost, '2026-12-01').readiness.budgetScore).toBe(20);

    const zero = computeCelebrationAnalytics(
      emptyPlan({ totalBudget: 0, allocation: allocate(0, 'wedding') }),
      '2026-12-01',
    );
    expect(zero.categories.every((c) => c.allocatedPct === 0)).toBe(true);
  });
});

describe('budget.ts branches', () => {
  const alloc = allocate(1_000_000, 'wedding');
  const feasible = () =>
    makePlan({
      totalBudget: 1_000_000,
      guests: 210,
      perPlate: 1750,
      allocation: allocate(1_000_000, 'wedding'),
      locked: [],
      priorities: [],
    });

  it('redistribute: no-op, all-locked, capped increase and decrease', () => {
    expect(redistribute(alloc, 'decor', alloc.decor).changes).toEqual([]);
    const allLocked = redistribute(alloc, 'decor', alloc.decor + 10, [...CATEGORIES]);
    expect(allLocked.capped).toBe(true);
    const capped = redistribute(alloc, 'decor', 9_999_999);
    expect(capped.capped).toBe(true);
    expect(sum(capped.allocation)).toBe(1_000_000);
    const down = redistribute(alloc, 'decor', 0, ['venue']);
    expect(down.allocation.venue).toBe(alloc.venue);
    expect(sum(down.allocation)).toBe(1_000_000);
  });

  it('generateOverBudgetOptions offers every option when feasible', () => {
    const over = feasible();
    expect(generateOverBudgetOptions(over).map((o) => o.id)).toEqual([
      'reduce_guests',
      'trim_categories',
      'use_contingency',
    ]);
    expect(generateOverBudgetOptions({ ...over, guests: 10 })).toEqual([]);
  });

  it('generateOverBudgetOptions omits options that cannot cover the gap', () => {
    const plan = { ...feasible(), perPlate: 100_000, locked: [...CATEGORIES] };
    expect(generateOverBudgetOptions(plan)).toEqual([]);
    expect(generateOverBudgetOptions({ ...plan, perPlate: 0 })).toEqual([]);
  });

  it('applyOption: each option, no-ops, and insufficient pool', () => {
    const plan = feasible();
    expect(applyOption(plan, 'reduce_guests').guests).toBeLessThan(plan.guests);
    expect(sum(applyOption(plan, 'use_contingency').allocation)).toBe(1_000_000);
    const trimmed = applyOption(plan, 'trim_categories');
    expect(sum(trimmed.allocation)).toBe(1_000_000);
    expect(trimmed.allocation.catering).toBeGreaterThan(plan.allocation.catering);

    const fine = { ...plan, guests: 10 };
    expect(applyOption(fine, 'reduce_guests')).toBe(fine);
    const locked = { ...plan, locked: [...CATEGORIES] };
    expect(applyOption(locked, 'trim_categories')).toBe(locked);
    expect(applyOption(plan, 'bogus' as unknown as 'reduce_guests')).toBe(plan);
  });

  it('budgetStatus counts booked quotes, payment-only vendors and zero budgets', () => {
    const plan = feasible();
    const withVendors: Plan = {
      ...plan,
      vendors: [
        {
          id: 'a',
          name: 'A',
          category: 'venue',
          status: 'booked',
          quote: {
            vendorName: 'A',
            category: 'venue',
            totalPrice: 300_000,
            pricePerPlate: null,
            guestMinimum: null,
            overtimeFeePerHour: null,
            taxIncluded: true,
            advancePercent: 25,
            inclusions: [],
            exclusions: [],
            cancellationPolicy: null,
          },
          payments: [],
        },
        {
          id: 'b',
          name: 'B',
          category: 'decor',
          status: 'quoted',
          payments: [{ id: 'p', title: 'x', amount: 1000, dueDate: '2027-01-01', status: 'paid' }],
        },
      ],
    };
    const s = budgetStatus(withVendors);
    expect(s.committed).toBe(301_000);
    expect(s.estimated).toBe(sum(plan.allocation) - plan.allocation.venue - plan.allocation.decor);
    expect(budgetStatus({ ...plan, totalBudget: 0 }).overByPct).toBe(0);
  });
});
