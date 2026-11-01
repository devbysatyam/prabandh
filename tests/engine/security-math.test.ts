import { describe, it, expect } from 'vitest';
import { largestRemainderRound, formatINR, parseINR } from '../../src/engine/money';
import { allocate } from '../../src/engine/budget';
import { IntakeSchema } from '../../src/schemas';

describe('Security & Boundary Mathematics Defense', () => {
  describe('Integer Arithmetic & Allocation Invariants', () => {
    it('guarantees 100% exact sum invariance for extreme budgets up to ₹50 Crores', () => {
      const extremeBudgets = [10000, 50000, 100000, 850000, 1500000, 50000000, 500000000];

      for (const budget of extremeBudgets) {
        const allocation = allocate(budget, 'wedding', ['venue', 'catering']);
        const sum = Object.values(allocation).reduce((a, b) => a + b, 0);
        expect(sum).toBe(budget);
      }
    });

    it('safely handles largest remainder rounding with edge cases', () => {
      // Empty input
      expect(largestRemainderRound({}, 1000)).toEqual({});

      // Zero total
      expect(largestRemainderRound({ a: 0.3, b: 0.7 }, 0)).toEqual({ a: 0, b: 0 });

      // Single item
      expect(largestRemainderRound({ only: 1.0 }, 50000)).toEqual({ only: 50000 });

      // Highly fragmented float percentages summing to exactly 1.0
      const weights = { c1: 0.1111, c2: 0.2222, c3: 0.3333, c4: 0.3334 };
      const result = largestRemainderRound(weights, 100000);
      const total = Object.values(result).reduce((a, b) => a + b, 0);
      expect(total).toBe(100000);
    });

    it('handles negative or invalid number parsing gracefully without crashing', () => {
      expect(parseINR('-50000')).toBeNull();
      expect(parseINR('NaN')).toBeNull();
      expect(parseINR('undefined')).toBeNull();
      expect(parseINR('<script>alert("hack")</script>')).toBeNull();
      expect(parseINR("'; DROP TABLE budgets; --")).toBeNull();
    });

    it('formats boundary numbers safely', () => {
      expect(formatINR(0)).toBe('₹0');
      expect(formatINR(Number.MAX_SAFE_INTEGER)).toContain('₹');
      expect(formatINR(-1)).toBe('-₹1');
    });
  });

  describe('XSS & Malicious Injection Payload Resistance', () => {
    it('accepts and safely schema-validates intake with special characters and HTML strings', () => {
      const maliciousPayload = {
        city: 'Delhi"><svg onload=alert(1)>',
        occasion: 'wedding',
        eventDate: '2027-02-14',
        guests: 150,
        totalBudget: 1500000,
        priorities: ['venue', 'catering'],
      };

      const parsed = IntakeSchema.safeParse(maliciousPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        // Stored safely as raw string, never executed
        expect(parsed.data.city).toBe('Delhi"><svg onload=alert(1)>');
      }
    });

    it('rejects invalid schema inputs that violate security bounds', () => {
      // Negative guests
      const negGuests = IntakeSchema.safeParse({
        city: 'Mumbai',
        occasion: 'wedding',
        eventDate: '2027-02-14',
        guests: -50,
        totalBudget: 1500000,
        priorities: ['venue'],
      });
      expect(negGuests.success).toBe(false);

      // Negative budget
      const negBudget = IntakeSchema.safeParse({
        city: 'Mumbai',
        occasion: 'wedding',
        eventDate: '2027-02-14',
        guests: 100,
        totalBudget: -50000,
        priorities: ['venue'],
      });
      expect(negBudget.success).toBe(false);

      // Invalid event date format
      const invalidDate = IntakeSchema.safeParse({
        city: 'Pune',
        occasion: 'wedding',
        eventDate: 'tomorrow',
        guests: 100,
        totalBudget: 500000,
        priorities: ['venue'],
      });
      expect(invalidDate.success).toBe(false);
    });
  });
});
