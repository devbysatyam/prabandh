import { describe, it, expect } from 'vitest';
import { evaluateVenue, formatVenueWhatsappInquiry } from '../../src/engine/venues';
import type { VenueDetail } from '../../src/schemas';

describe('venues.ts', () => {
  const sampleVenue: VenueDetail = {
    id: 'v-1',
    name: 'Amaltas Royal Heritage Resort',
    type: 'outdoor_lawn',
    capacityMin: 150,
    capacityMax: 400,
    rentalCost: 350000,
    cateringPolicy: 'royalty_fee',
    alcoholAllowed: true,
    parkingCapacity: 120,
    roomsIncluded: 4,
    curfewTime: '23:00',
    cautionDeposit: 50000,
    address: 'Pune-Bangalore Highway',
    status: 'shortlisted',
    notes: 'Sprawling banyan tree lawn with heritage dining pavilion',
  };

  it('evaluates optimal capacity when guests fit comfortably', () => {
    const evaluation = evaluateVenue(sampleVenue, 250);
    expect(evaluation.capacityStatus).toBe('optimal');
    expect(evaluation.isSuitableForGuests).toBe(true);
    expect(evaluation.totalEstimatedCost).toBe(400000); // 350,000 + 50,000 caution
    expect(evaluation.policyNotes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Outside caterers allowed subject to kitchen royalty fee'),
        expect.stringContaining('Outdoor amplified sound curfew strictly at 23:00'),
        expect.stringContaining('4 air-conditioned green/bridal rooms included'),
        expect.stringContaining('Liquor allowed with standard one-day state excise permit'),
      ]),
    );
  });

  it('flags cramped capacity when guest count exceeds max capacity', () => {
    const evaluation = evaluateVenue(sampleVenue, 500);
    expect(evaluation.capacityStatus).toBe('cramped');
    expect(evaluation.isSuitableForGuests).toBe(false);
    expect(evaluation.capacityMessage).toContain('exceeds venue maximum capacity');
  });

  it('flags excessive capacity notice when guest count is below minimum', () => {
    const evaluation = evaluateVenue(sampleVenue, 80);
    expect(evaluation.capacityStatus).toBe('excessive');
    expect(evaluation.isSuitableForGuests).toBe(true);
    expect(evaluation.capacityMessage).toContain('below the venue minimum requirement');
  });

  it('generates a respectful WhatsApp enquiry message with venue details', () => {
    const inquiry = formatVenueWhatsappInquiry(
      sampleVenue,
      '2026-12-20',
      250,
      'Sharma & Verma Grand Wedding',
    );
    expect(inquiry).toContain('Amaltas Royal Heritage Resort');
    expect(inquiry).toContain('Sharma & Verma Grand Wedding');
    expect(inquiry).toContain('250 guests');
    expect(inquiry).toContain('OUTDOOR LAWN');
    expect(inquiry).toContain('kitchen royalty charges');
    expect(inquiry).toContain('Curfew guidelines');
  });
});
