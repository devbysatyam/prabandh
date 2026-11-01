import { describe, it, expect } from 'vitest';
import {
  effectiveQuoteCost,
  compareQuoteToBudget,
  calculateVendorPayments,
  generateVendorInquiry,
} from '../../src/engine/vendors';
import type { Quote, Vendor } from '../../src/schemas';

describe('vendors.ts', () => {
  it('calculates effective quote cost from total or per-plate rates', () => {
    const fixedQuote: Quote = {
      vendorName: 'Venue',
      category: 'venue',
      totalPrice: 250000,
      pricePerPlate: null,
      guestMinimum: null,
      overtimeFeePerHour: null,
      taxIncluded: true,
      advancePercent: 25,
      inclusions: [],
      exclusions: [],
      cancellationPolicy: 'Refundable up to 30 days',
    };
    expect(effectiveQuoteCost(fixedQuote, 200)).toBe(250000);

    const plateQuote: Quote = {
      vendorName: 'Catering',
      category: 'catering',
      totalPrice: null,
      pricePerPlate: 1500,
      guestMinimum: 250,
      overtimeFeePerHour: null,
      taxIncluded: false,
      advancePercent: 50,
      inclusions: [],
      exclusions: [],
      cancellationPolicy: null,
    };
    // 200 guests, but guestMinimum is 250 -> 250 * 1500 = 375,000
    expect(effectiveQuoteCost(plateQuote, 200)).toBe(375000);
  });

  it('evaluates quotes against category budgets and surfaces contract flags', () => {
    const quote: Quote = {
      vendorName: 'Caterer X',
      category: 'catering',
      totalPrice: 400000,
      pricePerPlate: null,
      guestMinimum: null,
      overtimeFeePerHour: null,
      taxIncluded: null, // missing tax
      advancePercent: 60, // high advance
      inclusions: [],
      exclusions: [],
      cancellationPolicy: null, // no cancellation policy
    };

    const comparison = compareQuoteToBudget(quote, 300000, 150);
    expect(comparison.isOverBudget).toBe(true);
    expect(comparison.variance).toBe(100000);

    const flagCodes = comparison.flags.map((f) => f.code);
    expect(flagCodes).toContain('OVER_BUDGET');
    expect(flagCodes).toContain('TAX_UNSPECIFIED');
    expect(flagCodes).toContain('HIGH_ADVANCE');
    expect(flagCodes).toContain('NO_CANCELLATION_POLICY');
  });

  it('tracks vendor payment milestone schedules', () => {
    const vendor: Vendor = {
      id: 'v1',
      name: 'Photographer',
      category: 'photography',
      status: 'booked',
      payments: [
        { id: '1', title: 'Token', amount: 30000, dueDate: '2026-10-01', status: 'paid' },
        { id: '2', title: 'Balance', amount: 70000, dueDate: '2026-12-01', status: 'pending' },
      ],
    };

    const summary = calculateVendorPayments(vendor);
    expect(summary.totalAgreed).toBe(100000);
    expect(summary.totalPaid).toBe(30000);
    expect(summary.balanceRemaining).toBe(70000);
    expect(summary.paidPercentage).toBe(30);
    expect(summary.nextMilestone?.title).toBe('Balance');
  });

  it('generates polite WhatsApp negotiation message for missing quote details', () => {
    const quote: Quote = {
      vendorName: 'Royal Decor',
      category: 'decor',
      totalPrice: 150000,
      pricePerPlate: null,
      guestMinimum: null,
      overtimeFeePerHour: null,
      taxIncluded: null,
      advancePercent: 50,
      inclusions: [],
      exclusions: [],
      cancellationPolicy: null,
    };

    const inquiry = generateVendorInquiry('Royal Decor', 'decor', quote, 150, '2026-12-25');
    expect(inquiry).toContain('Namaste Royal Decor!');
    expect(inquiry).toContain('18% GST');
    expect(inquiry).toContain('cancellation');
    expect(inquiry).toContain('50% advance');
  });
});
