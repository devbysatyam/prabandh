import { describe, it, expect } from 'vitest';
import { generateIcsCalendar } from '../../src/engine/calendar';
import { aggregateGuests, syncGuestCountWithList } from '../../src/engine/guests';
import { largestRemainderRound } from '../../src/engine/money';
import { cycleRunSheetStatus, formatRunSheetWhatsapp } from '../../src/engine/runsheet';
import { buildSchedule, topologicalSort } from '../../src/engine/timeline';
import {
  calculateVendorPayments,
  compareQuoteToBudget,
  effectiveQuoteCost,
  generateVendorInquiry,
  vendorChecklist,
} from '../../src/engine/vendors';
import { evaluateVenue, formatVenueWhatsappInquiry } from '../../src/engine/venues';
import { generateFamilyWhatsappUpdate } from '../../src/engine/whatsapp';
import type { Quote, RunSheetItem, Task, VenueDetail } from '../../src/schemas';
import { createSamplePlan } from '../../src/state/planStore';

const quote = (over: Partial<Quote> = {}): Quote => ({
  vendorName: 'V',
  category: 'catering',
  totalPrice: null,
  pricePerPlate: null,
  guestMinimum: null,
  overtimeFeePerHour: null,
  taxIncluded: true,
  advancePercent: null,
  inclusions: [],
  exclusions: [],
  cancellationPolicy: 'Flexible',
  ...over,
});

const venue = (over: Partial<VenueDetail> = {}): VenueDetail => ({
  id: 'v',
  name: 'Hall',
  type: 'banquet_hall',
  capacityMin: 100,
  capacityMax: 300,
  rentalCost: 100_000,
  cateringPolicy: 'external_allowed',
  alcoholAllowed: false,
  parkingCapacity: 50,
  roomsIncluded: 2,
  curfewTime: '23:00',
  cautionDeposit: 25_000,
  status: 'shortlisted',
  ...over,
});

describe('money.ts edge cases', () => {
  it('splits equally when all weights are zero and zeroes when the total is non-positive', () => {
    expect(largestRemainderRound({ a: 0, b: 0, c: 0 }, 10)).toEqual({ a: 4, b: 3, c: 3 });
    expect(largestRemainderRound({ a: 1, b: 2 }, 0)).toEqual({ a: 0, b: 0 });
    expect(largestRemainderRound({}, 10)).toEqual({});
  });
});

describe('guests.ts', () => {
  it('syncGuestCountWithList uses confirmed-only or confirmed+pending and preserves when empty', () => {
    const base = createSamplePlan();
    const withList = {
      ...base,
      guests: 1,
      guestList: [
        {
          id: 'a',
          name: 'A',
          count: 3,
          side: 'general' as const,
          rsvp: 'confirmed' as const,
          diet: 'veg' as const,
        },
        {
          id: 'b',
          name: 'B',
          count: 2,
          side: 'general' as const,
          rsvp: 'pending' as const,
          diet: 'any' as const,
        },
        {
          id: 'c',
          name: 'C',
          count: 5,
          side: 'general' as const,
          rsvp: 'declined' as const,
          diet: 'any' as const,
        },
      ],
    };
    expect(syncGuestCountWithList(withList).guests).toBe(5);
    expect(syncGuestCountWithList(withList, true).guests).toBe(3);
    const empty = { ...base, guestList: [] };
    expect(syncGuestCountWithList(empty)).toBe(empty);
    const none = { ...withList, guestList: withList.guestList.slice(2) };
    expect(syncGuestCountWithList(none)).toBe(none);
    expect(aggregateGuests(withList.guestList).declinedCount).toBe(5);
  });
});

describe('vendors.ts', () => {
  it('effectiveQuoteCost handles total, per-plate with minimum, and empty quotes', () => {
    expect(effectiveQuoteCost(quote({ totalPrice: 5000 }), 100)).toBe(5000);
    expect(effectiveQuoteCost(quote({ pricePerPlate: 100, guestMinimum: 150 }), 100)).toBe(15000);
    expect(effectiveQuoteCost(quote({ pricePerPlate: 100 }), 100)).toBe(10000);
    expect(effectiveQuoteCost(quote(), 100)).toBe(0);
  });

  it('compareQuoteToBudget raises every kind of flag', () => {
    const risky = compareQuoteToBudget(
      quote({
        totalPrice: 200_000,
        guestMinimum: 500,
        advancePercent: 80,
        taxIncluded: null,
        cancellationPolicy: null,
      }),
      100_000,
      100,
    );
    expect(risky.flags.map((f) => f.code)).toEqual([
      'OVER_BUDGET',
      'GUEST_MINIMUM_EXCEEDS',
      'HIGH_ADVANCE',
      'TAX_UNSPECIFIED',
      'NO_CANCELLATION_POLICY',
    ]);
    const zeroBudget = compareQuoteToBudget(quote({ totalPrice: 10 }), 0, 100);
    expect(zeroBudget.flags[0]?.message).toContain('zero');
    const good = compareQuoteToBudget(
      quote({ totalPrice: 10_000, taxIncluded: false }),
      50_000,
      100,
    );
    expect(good.flags.map((f) => f.code)).toEqual(['WITHIN_BUDGET', 'TAX_EXTRA']);
    expect(compareQuoteToBudget(quote(), 1000, 10).flags.map((f) => f.code)).not.toContain(
      'WITHIN_BUDGET',
    );
  });

  it('calculateVendorPayments tracks paid, remaining and the next milestone', () => {
    const vendor = {
      id: 'v',
      name: 'V',
      category: 'catering' as const,
      status: 'booked' as const,
      quote: quote({ totalPrice: 100_000 }),
      payments: [
        { id: 'p1', title: 'Adv', amount: 30_000, dueDate: '2026-12-01', status: 'paid' as const },
        {
          id: 'p2',
          title: 'Mid',
          amount: 30_000,
          dueDate: '2026-12-10',
          status: 'pending' as const,
        },
        {
          id: 'p3',
          title: 'End',
          amount: 40_000,
          dueDate: '2026-12-20',
          status: 'pending' as const,
        },
      ],
    };
    const s = calculateVendorPayments(vendor);
    expect(s.totalPaid).toBe(30_000);
    expect(s.balanceRemaining).toBe(70_000);
    expect(s.paidPercentage).toBe(30);
    expect(s.nextMilestone?.title).toBe('Mid');
    const none = calculateVendorPayments({ ...vendor, quote: null, payments: [] });
    expect(none.paidPercentage).toBe(0);
    expect(none.nextMilestone).toBeNull();
  });

  it('generateVendorInquiry only asks about what is missing', () => {
    const msg = generateVendorInquiry(
      '',
      'catering',
      quote({ taxIncluded: null, cancellationPolicy: null, advancePercent: 60, guestMinimum: 400 }),
      100,
      '2026-12-20',
    );
    expect(msg).toContain('Namaste Ji');
    expect(msg).toContain('GST');
    expect(msg).toContain('cancellation');
    expect(msg).toContain('60% advance');
    expect(msg).toContain('400 minimum');
    const clean = generateVendorInquiry('Raju', 'catering', quote(), 100, '2026-12-20');
    expect(clean).toContain('Namaste Raju');
    expect(clean).not.toContain('1.');
  });

  it('vendorChecklist reports booked, quoted and contacted states', () => {
    const plan = {
      ...createSamplePlan(),
      contacted: ['misc' as const],
      vendors: [
        { id: '1', name: 'A', category: 'venue' as const, status: 'booked' as const, payments: [] },
        { id: '2', name: 'B', category: 'decor' as const, status: 'quoted' as const, payments: [] },
        {
          id: '3',
          name: 'C',
          category: 'photography' as const,
          status: 'contacted' as const,
          payments: [],
        },
      ],
      quotes: [
        { id: 'q', category: 'catering' as const, quote: quote(), accepted: true },
        { id: 'q2', category: 'entertainment' as const, quote: quote(), accepted: false },
      ],
    };
    const byCat = Object.fromEntries(vendorChecklist(plan).map((i) => [i.category, i.status]));
    expect(byCat).toMatchObject({
      venue: 'booked',
      decor: 'quoted',
      photography: 'contacted',
      catering: 'booked',
      entertainment: 'quoted',
      misc: 'contacted',
    });
  });
});

describe('venues.ts', () => {
  it('evaluates cramped, excessive and optimal capacity with each policy', () => {
    expect(evaluateVenue(venue(), 500).capacityStatus).toBe('cramped');
    expect(evaluateVenue(venue(), 500).isSuitableForGuests).toBe(false);
    expect(evaluateVenue(venue(), 20).capacityStatus).toBe('excessive');
    expect(evaluateVenue(venue(), 200).capacityStatus).toBe('optimal');
    const inHouse = evaluateVenue(
      venue({ cateringPolicy: 'in_house_mandatory', alcoholAllowed: true }),
      200,
    );
    expect(inHouse.policyNotes.join()).toContain('mandatory');
    expect(inHouse.policyNotes.join()).toContain('Liquor allowed');
    const royalty = evaluateVenue(venue({ cateringPolicy: 'royalty_fee' }), 200);
    expect(royalty.policyNotes.join()).toContain('royalty');
    expect(royalty.totalEstimatedCost).toBe(125_000);
  });

  it('formats a venue WhatsApp enquiry', () => {
    const msg = formatVenueWhatsappInquiry(
      venue({ type: 'outdoor_lawn' }),
      '2026-12-20',
      200,
      'Shaadi',
    );
    expect(msg).toContain('OUTDOOR LAWN');
    expect(msg).toContain('200 guests');
  });
});

describe('whatsapp.ts / runsheet.ts / calendar.ts / timeline.ts', () => {
  it('family update covers over-budget, today and empty guest list variants', () => {
    const base = createSamplePlan();
    const over = generateFamilyWhatsappUpdate(
      { ...base, guests: 900, perPlate: 9000, guestList: [], tasks: [] },
      base.eventDate,
    );
    expect(over).toContain('Celebration Day!');
    expect(over).toContain('Over budget');
    expect(over).not.toContain('Confirmed RSVPs');
    const normal = generateFamilyWhatsappUpdate(base, '2020-01-01');
    expect(normal).toContain('days to go');
  });

  it('run sheet cycles statuses and formats every status icon', () => {
    const items: RunSheetItem[] = [
      {
        id: '1',
        time: '10:00',
        title: 'A',
        status: 'pending',
        coordinator: 'Raj',
        description: 'd',
      },
      { id: '2', time: '09:00', title: 'B', status: 'in_progress' },
      { id: '3', time: '08:00', title: 'C', status: 'completed' },
    ];
    expect(cycleRunSheetStatus(items, '1')[0]?.status).toBe('in_progress');
    expect(cycleRunSheetStatus(items, '2')[1]?.status).toBe('completed');
    expect(cycleRunSheetStatus(items, '3')[2]?.status).toBe('pending');
    const msg = formatRunSheetWhatsapp(items, 'Event', '2026-12-20');
    expect(msg).toContain('✅');
    expect(msg).toContain('⏳');
    expect(msg).toContain('📌');
    expect(msg).toContain('Lead: Raj');
  });

  it('ICS output handles items without description or coordinator and folds long lines', () => {
    const items: RunSheetItem[] = [
      { id: '1', time: '10:30', title: 'X'.repeat(200), status: 'pending' },
    ];
    const ics = generateIcsCalendar('E;vent, big', '2026-12-20', [], items);
    expect(ics).toContain('Coordinator: Host Family');
    expect(ics).toContain('\r\n ');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('topologicalSort keeps every task when there is a dependency cycle', () => {
    const t = (id: string, dependsOn: string[]): Task => ({
      id,
      title: id,
      category: 'venue',
      leadDays: 10,
      durationDays: 1,
      dependsOn,
      status: 'todo',
    });
    const tasks = [t('a', ['b']), t('b', ['a']), t('c', [])];
    expect(
      topologicalSort(tasks)
        .map((x) => x.id)
        .sort(),
    ).toEqual(['a', 'b', 'c']);
    expect(buildSchedule(tasks, '2027-01-01', '2026-12-01')).toHaveLength(3);
  });
});
