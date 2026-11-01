import { describe, it, expect } from 'vitest';
import {
  formatINR,
  toLakh,
  parseINR,
  largestRemainderRound,
} from '../../src/engine/money';

describe('money.ts', () => {
  describe('formatINR', () => {
    it('formats numbers using Indian numbering system', () => {
      expect(formatINR(0)).toBe('₹0');
      expect(formatINR(500)).toBe('₹500');
      expect(formatINR(1000)).toBe('₹1,000');
      expect(formatINR(10000)).toBe('₹10,000');
      expect(formatINR(100000)).toBe('₹1,00,000');
      expect(formatINR(850000)).toBe('₹8,50,000');
      expect(formatINR(10000000)).toBe('₹1,00,00,000');
    });

    it('handles negative and non-finite values safely', () => {
      expect(formatINR(-50000)).toBe('-₹50,000');
      expect(formatINR(NaN)).toBe('₹0');
      expect(formatINR(Infinity)).toBe('₹0');
    });
  });

  describe('toLakh', () => {
    it('converts amounts into compact Lakh/Crore strings', () => {
      expect(toLakh(850000)).toBe('₹8.5 Lakh');
      expect(toLakh(100000)).toBe('₹1 Lakh');
      expect(toLakh(25000000)).toBe('₹2.5 Crore');
      expect(toLakh(75000)).toBe('₹75 Thousand');
      expect(toLakh(500)).toBe('₹500');
    });
  });

  describe('parseINR', () => {
    it('parses diverse user written currency formats', () => {
      expect(parseINR('8 lakh')).toBe(800000);
      expect(parseINR('8.5L')).toBe(850000);
      expect(parseINR('8.5 lac')).toBe(850000);
      expect(parseINR('12 lakhs')).toBe(1200000);
      expect(parseINR('2 crore')).toBe(20000000);
      expect(parseINR('1.5 cr')).toBe(15000000);
      expect(parseINR('50k')).toBe(50000);
      expect(parseINR('75 thousand')).toBe(75000);
      expect(parseINR('₹8,00,000')).toBe(800000);
      expect(parseINR('800000')).toBe(800000);
      expect(parseINR('Rs. 1,50,000')).toBe(150000);
    });

    it('returns null on invalid input', () => {
      expect(parseINR('')).toBeNull();
      expect(parseINR('abc')).toBeNull();
      expect(parseINR('---')).toBeNull();
    });
  });

  describe('largestRemainderRound', () => {
    it('guarantees category allocations sum EXACTLY to total', () => {
      const proportions = {
        venue: 20,
        catering: 35,
        decor: 12,
        photography: 10,
        entertainment: 8,
        misc: 5,
        contingency: 10,
      };

      const total = 1000003; // Odd total to trigger fractional remainders
      const result = largestRemainderRound(proportions, total);
      const sum = Object.values(result).reduce((a, b) => a + b, 0);

      expect(sum).toBe(total);
      for (const val of Object.values(result)) {
        expect(Number.isInteger(val)).toBe(true);
        expect(val).toBeGreaterThan(0);
      }
    });

    it('handles zero target total', () => {
      const result = largestRemainderRound({ a: 10, b: 20 }, 0);
      expect(result).toEqual({ a: 0, b: 0 });
    });
  });
});
