import type { Category, Intake, Plan, RunSheetItem, Vendor, VenueDetail } from '../schemas';
import { allocate, compressTasks, diffDays } from '../engine';
import { OCCASION_RUNSHEET, OCCASION_TASKS } from '../engine/presets';

/** Per-plate cost (rupees) assumed when the guest count is zero. */
export const DEFAULT_PER_PLATE = 1000;

const CATEGORIES_TO_BOOK: readonly Category[] = [
  'venue',
  'catering',
  'decor',
  'photography',
  'entertainment',
  'misc',
];

const OCCASION_TITLES: Record<Intake['occasion'], string> = {
  wedding: 'Grand Wedding',
  kids_birthday: "Kid's Birthday Celebration",
  milestone: 'Milestone Celebration',
  community: 'Community Festival',
};

/** Defaults for the auto-created starter venue. */
const STARTER_VENUE = {
  capacityMin: 100,
  minCapacityMax: 300,
  capacityBuffer: 100,
  rentalShare: 0.85,
  parking: 150,
  rooms: 3,
  cautionDeposit: 30_000,
} as const;

/**
 * Today's date as an ISO string.
 *
 * @returns YYYY-MM-DD.
 * @example
 * ```ts
 * isoToday(); // => '2026-11-02'
 * ```
 */
export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Builds a fresh plan (allocation, tasks, run sheet, starter vendors and venue) from an intake.
 *
 * @param intake - Validated intake.
 * @param today - Reference date (defaults to today); tasks are compressed when the runway is short.
 * @returns A complete plan whose allocation sums exactly to the budget.
 * @example
 * ```ts
 * const plan = createDefaultPlan(intake, '2026-11-02');
 * plan.allocation.contingency; // => 10% of the budget
 * ```
 */
export function createDefaultPlan(intake: Intake, today: string = isoToday()): Plan {
  const allocation = allocate(intake.totalBudget, intake.occasion, intake.priorities);
  const perPlate =
    intake.guests > 0 ? Math.round(allocation.catering / intake.guests) : DEFAULT_PER_PLATE;

  // Generate initial tasks
  const rawTasks = OCCASION_TASKS[intake.occasion];
  const daysToEvent = Math.max(1, diffDays(today, intake.eventDate));
  const tasksWithIds = rawTasks.map((t, index) => ({
    ...t,
    id: `task-${index + 1}`,
  }));
  const tasks = compressTasks(tasksWithIds, daysToEvent);

  // Generate initial day-of runsheet
  const rawRunsheet = OCCASION_RUNSHEET[intake.occasion];
  const runSheet: RunSheetItem[] = rawRunsheet.map((r, index) => ({
    ...r,
    id: `rs-${index + 1}`,
    status: 'pending',
  }));

  // Initial vendor checklist
  const vendors: Vendor[] = CATEGORIES_TO_BOOK.map((cat, i) => ({
    id: `v-${i + 1}`,
    name: `Preferred ${cat.toUpperCase()} Vendor`,
    category: cat,
    status: 'shortlisted',
    payments: [],
  }));

  // Initial starter venue option
  const initialVenues: VenueDetail[] = [
    {
      id: `venue-1`,
      name: `${intake.city ?? 'City'} Royal Heritage Lawn & Ballroom`,
      type: 'outdoor_lawn',
      capacityMin: STARTER_VENUE.capacityMin,
      capacityMax: Math.max(
        STARTER_VENUE.minCapacityMax,
        intake.guests + STARTER_VENUE.capacityBuffer,
      ),
      rentalCost: Math.round(allocation.venue * STARTER_VENUE.rentalShare),
      cateringPolicy: 'external_allowed',
      alcoholAllowed: true,
      parkingCapacity: STARTER_VENUE.parking,
      roomsIncluded: STARTER_VENUE.rooms,
      curfewTime: '23:00',
      cautionDeposit: STARTER_VENUE.cautionDeposit,
      address: intake.city ? `${intake.city} Bypass Road` : 'Central Celebration Avenue',
      status: 'shortlisted',
      notes: 'Lush green lawn with attached air-conditioned dining banquet hall.',
    },
  ];

  const title = `${OCCASION_TITLES[intake.occasion]} Plan`;

  return {
    id: `plan-${Date.now()}`,
    version: 1,
    title,
    occasion: intake.occasion,
    eventDate: intake.eventDate,
    totalBudget: intake.totalBudget,
    guests: intake.guests,
    vibe: intake.vibe ?? 'Elegant, joyful celebration with close friends and family',
    city: intake.city,
    priorities: intake.priorities,
    priorityKeys: intake.priorityKeys ?? [],
    allocation,
    locked: [],
    contacted: [],
    perPlate,
    tasks,
    guestList: [],
    vendors,
    venues: initialVenues,
    siteVisits: [],
    quotes: [],
    vendorMeetings: [],
    runSheet,
  };
}
