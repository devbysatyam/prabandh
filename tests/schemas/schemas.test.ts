import { describe, it, expect } from 'vitest';
import {
  PlanSchema,
  GuestSchema,
  VendorSchema,
  QuoteSchema,
  TaskSchema,
  IntakeSchema,
  SiteVisitSchema,
  VendorMeetingSchema,
} from '../../src/schemas';
import { createSamplePlan } from '../../src/state/planStore';

describe('schemas/index.ts', () => {
  it('validates correct Intake object', () => {
    const valid = IntakeSchema.safeParse({
      occasion: 'wedding',
      totalBudget: 1500000,
      guests: 200,
      eventDate: '2026-12-25',
      vibe: 'Joyful celebration',
      city: 'Pune',
      priorities: ['catering', 'venue'],
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid budget or guests', () => {
    const invalid = IntakeSchema.safeParse({
      occasion: 'wedding',
      totalBudget: -500, // Negative budget
      guests: 0,
      eventDate: 'invalid-date',
      priorities: [],
    });
    expect(invalid.success).toBe(false);
  });

  it('validates Guest schema with default values', () => {
    const valid = GuestSchema.safeParse({
      id: 'g1',
      name: 'Sharma Family',
      count: 4,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.side).toBe('general');
      expect(valid.data.rsvp).toBe('pending');
      expect(valid.data.diet).toBe('veg');
    }
  });

  it('validates Task schema', () => {
    const task = TaskSchema.safeParse({
      id: 't1',
      title: 'Book Venue',
      category: 'venue',
      leadDays: 90,
      durationDays: 7,
      dependsOn: [],
      status: 'todo',
    });
    expect(task.success).toBe(true);
  });

  it('validates Vendor and Quote schema', () => {
    const quote = QuoteSchema.safeParse({
      vendorName: 'Royal Tent House',
      category: 'decor',
      totalPrice: 200000,
      pricePerPlate: null,
      guestMinimum: null,
      overtimeFeePerHour: 5000,
      taxIncluded: true,
      advancePercent: 25,
      inclusions: ['Stage setup', 'Mandap floral'],
      exclusions: [],
      cancellationPolicy: 'Non refundable',
    });
    expect(quote.success).toBe(true);

    const vendor = VendorSchema.safeParse({
      id: 'v1',
      name: 'Royal Tent House',
      category: 'decor',
      status: 'booked',
      quote: quote.success ? quote.data : null,
      payments: [],
    });
    expect(vendor.success).toBe(true);
  });

  it('validates full Plan schema', () => {
    const plan = PlanSchema.safeParse({
      id: 'plan-1',
      version: 1,
      title: 'Grand Shaadi',
      occasion: 'wedding',
      eventDate: '2026-12-30',
      totalBudget: 2000000,
      guests: 300,
      vibe: 'Royal elegance',
      priorities: ['catering', 'photography'],
      allocation: {
        venue: 400000,
        catering: 700000,
        decor: 240000,
        photography: 200000,
        entertainment: 160000,
        misc: 100000,
        contingency: 200000,
      },
      locked: ['catering'],
      perPlate: 2333,
      tasks: [],
      guestList: [],
      vendors: [],
      runSheet: [],
    });
    expect(plan.success).toBe(true);
  });

  it('validates SiteVisit schema with physical recce inspection fields', () => {
    const visit = SiteVisitSchema.safeParse({
      id: 'sv-1',
      venueId: 'v-1',
      venueName: 'The Corinthians Resort, Pune',
      visitDate: '2026-11-15',
      attendees: 'Amit (Groom), Priya (Bride), Sharma Uncle',
      rating: 5,
      acWorking: true,
      bridalRoomClean: true,
      soundCurfewOk: true,
      parkingAdequate: true,
      tastingDone: true,
      tastingNotes: 'Paneer tikka and dal makhani tested excellent',
      notes: 'Confirmed 2 complimentary green rooms for bride and groom family',
      status: 'completed',
    });
    expect(visit.success).toBe(true);
  });

  it('validates VendorMeeting schema with tasting and trial logs', () => {
    const meeting = VendorMeetingSchema.safeParse({
      id: 'vm-1',
      vendorId: 'vend-1',
      vendorName: 'Royal Awadhi Caterers',
      category: 'catering',
      meetingType: 'food_tasting',
      meetingDate: '2026-11-18',
      attendees: 'Parents & Couple',
      rating: 5,
      dishesOrItemsTested: 'Galouti kebab, Biryani, Kesari Phirni, Live Chaat',
      feedback: 'Reduce chili in mutton rogan josh; live jalebi counter approved',
      status: 'completed',
    });
    expect(meeting.success).toBe(true);
  });

  it('generates fully valid rich interactive sample plan', () => {
    const sample = createSamplePlan();
    const validated = PlanSchema.safeParse(sample);
    expect(validated.success).toBe(true);
    expect(sample.title).toContain('Sharma & Verma');
    expect(sample.venues.length).toBeGreaterThanOrEqual(2);
    expect(sample.siteVisits.length).toBeGreaterThanOrEqual(1);
    expect(sample.vendorMeetings.length).toBeGreaterThanOrEqual(1);
    expect(sample.guestList.length).toBeGreaterThanOrEqual(6);
  });
});
