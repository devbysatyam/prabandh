import { describe, it, expect } from 'vitest';
import { requireDefined } from '../helpers';
import {
  aggregateGuests,
  syncGuestCountWithList,
  formatGuestWhatsappInvite,
} from '../../src/engine/guests';
import type { Guest, Plan } from '../../src/schemas';
import { allocate } from '../../src/engine/budget';

describe('guests.ts', () => {
  const sampleGuests: Guest[] = [
    { id: '1', name: 'Sharma Family', count: 4, side: 'bride', rsvp: 'confirmed', diet: 'veg' },
    { id: '2', name: 'Verma Family', count: 2, side: 'groom', rsvp: 'pending', diet: 'jain' },
    { id: '3', name: 'Kapoor Couple', count: 2, side: 'bride', rsvp: 'declined', diet: 'non_veg' },
  ];

  it('aggregates guest counts, RSVPs, sides, and diets accurately', () => {
    const summary = aggregateGuests(sampleGuests);
    expect(summary.totalInvitedCount).toBe(8); // 4 + 2 + 2
    expect(summary.confirmedCount).toBe(4);
    expect(summary.pendingCount).toBe(2);
    expect(summary.declinedCount).toBe(2);
    expect(summary.bySide.bride).toBe(6);
    expect(summary.bySide.groom).toBe(2);
    expect(summary.byDiet.veg).toBe(4);
    expect(summary.byDiet.jain).toBe(2);
    expect(summary.byDiet.non_veg).toBe(2);
    expect(summary.confirmationRate).toBe(50); // 4/8 = 50%
  });

  it('syncs guest count with plan and triggers connected state', () => {
    const plan: Plan = {
      id: 'p1',
      version: 1,
      title: 'Shaadi',
      occasion: 'wedding',
      eventDate: '2026-12-10',
      totalBudget: 1000000,
      guests: 50,
      vibe: '',
      priorities: [],
      priorityKeys: [],
      allocation: allocate(1000000, 'wedding'),
      locked: [],
      contacted: [],
      perPlate: 1500,
      tasks: [],
      guestList: sampleGuests,
      vendors: [],
      venues: [],
      siteVisits: [],
      quotes: [],
      vendorMeetings: [],
      runSheet: [],
    };

    const synced = syncGuestCountWithList(plan);
    expect(synced.guests).toBe(6); // 4 confirmed + 2 pending = 6 active
  });

  it('formats personalized WhatsApp invitation text with guest name and count', () => {
    const plan: Plan = {
      id: 'p1',
      version: 1,
      title: 'Grand Wedding',
      occasion: 'wedding',
      eventDate: '2026-12-10',
      totalBudget: 1000000,
      guests: 100,
      vibe: '',
      city: 'Pune',
      priorities: [],
      priorityKeys: [],
      allocation: allocate(1000000, 'wedding'),
      locked: [],
      contacted: [],
      perPlate: 1500,
      tasks: [],
      guestList: sampleGuests,
      vendors: [],
      venues: [],
      siteVisits: [],
      quotes: [],
      vendorMeetings: [],
      runSheet: [],
    };

    const text = formatGuestWhatsappInvite(requireDefined(sampleGuests[0]), plan);
    expect(text).toContain('Namaste Sharma Family!');
    expect(text).toContain('Grand Wedding');
    expect(text).toContain('Pune');
    expect(text).toContain('4 seat(s)');
  });
});
