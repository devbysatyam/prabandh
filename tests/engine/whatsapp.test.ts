import { describe, it, expect } from 'vitest';
import { generateFamilyWhatsappUpdate } from '../../src/engine/whatsapp';
import { allocate } from '../../src/engine/budget';
import type { Plan } from '../../src/schemas';

describe('whatsapp.ts', () => {
  it('generates rich WhatsApp update for family groups', () => {
    const plan: Plan = {
      id: 'p1',
      version: 1,
      title: 'Sharma Ji Ki Shaadi',
      occasion: 'wedding',
      eventDate: '2026-12-25',
      totalBudget: 1500000,
      guests: 200,
      vibe: 'Royal Feast',
      city: 'Jaipur',
      priorities: ['catering'],
      priorityKeys: [],
      allocation: allocate(1500000, 'wedding'),
      locked: [],
      contacted: [],
      perPlate: 1800,
      tasks: [
        {
          id: '1',
          title: 'Book Venue',
          category: 'venue',
          leadDays: 90,
          durationDays: 5,
          dependsOn: [],
          status: 'todo',
        },
      ],
      guestList: [
        { id: 'g1', name: 'Gupta Family', count: 4, side: 'bride', rsvp: 'confirmed', diet: 'veg' },
      ],
      vendors: [],
      venues: [],
      siteVisits: [],
      quotes: [],
      vendorMeetings: [],
      runSheet: [],
    };

    const update = generateFamilyWhatsappUpdate(plan, '2026-10-01');
    expect(update).toContain('Sharma Ji Ki Shaadi — Family Planning Update');
    expect(update).toContain('Jaipur');
    expect(update).toContain('Budget Summary');
    expect(update).toContain('₹15,00,000');
    expect(update).toContain('Confirmed RSVPs: 4');
    expect(update).toContain('Prabandh · प्रबंध');
  });
});
