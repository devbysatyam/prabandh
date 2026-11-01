import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { allocate, redistribute, budgetStatus, scaleGuests } from '../../src/engine/budget';
import { formatINR, largestRemainderRound, parseINR, toLakh } from '../../src/engine/money';
import {
  buildMailtoUrl,
  buildTelUrl,
  buildWhatsAppUrl,
  clampText,
  csvSafeCell,
  neutralizeForPrompt,
  sanitizePhone,
  stripControlChars,
} from '../../src/lib/sanitize';
import { CATEGORIES, OCCASIONS, type Allocation, type Category } from '../../src/schemas';
import { createSamplePlan } from '../../src/state/planStore';

const BAD_RANGES: [number, number][] = [
  [0, 8],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x9f],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
];
const isBadChar = (ch: string) => {
  const n = ch.charCodeAt(0);
  return BAD_RANGES.some(([lo, hi]) => n >= lo && n <= hi);
};

const sum = (a: Record<string, number>) => Object.values(a).reduce((s, n) => s + n, 0);
const budgetArb = fc.integer({ min: 0, max: 1_000_000_000 });
const occasionArb = fc.constantFrom(...OCCASIONS);
const categoryArb = fc.constantFrom<Category>(...CATEGORIES);
const prioritiesArb = fc.uniqueArray(categoryArb, { maxLength: 7 });

describe('money properties', () => {
  it('largestRemainderRound: parts sum exactly to the total and are non-negative integers', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 1e6, noNaN: true }), { minLength: 1, maxLength: 12 }),
        fc.integer({ min: 0, max: 1_000_000_000 }),
        (weights, total) => {
          const props: Record<string, number> = {};
          weights.forEach((w, i) => (props[`k${i}`] = w));
          const out = largestRemainderRound(props, total);
          expect(Object.keys(out).sort()).toEqual(Object.keys(props).sort());
          expect(sum(out)).toBe(total);
          for (const v of Object.values(out)) {
            expect(Number.isInteger(v)).toBe(true);
            expect(v).toBeGreaterThanOrEqual(0);
          }
        },
      ),
    );
  });

  it('largestRemainderRound: each part is within 1 rupee of its exact share', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 10_000 }), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 100_000_000 }),
        (weights, total) => {
          const props: Record<string, number> = {};
          weights.forEach((w, i) => (props[`k${i}`] = w));
          const raw = weights.reduce((s, w) => s + w, 0);
          const out = largestRemainderRound(props, total);
          weights.forEach((w, i) => {
            expect(Math.abs((out[`k${i}`] ?? 0) - (w / raw) * total)).toBeLessThan(1 + 1e-6);
          });
        },
      ),
    );
  });

  it('formatINR then parseINR round-trips non-negative integer rupees', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000_000 }), (n) => {
        expect(parseINR(formatINR(n))).toBe(n);
      }),
    );
  });

  it('formatINR keeps the digits of the rounded value and never throws', () => {
    fc.assert(
      fc.property(fc.double({ min: -1e12, max: 1e12, noNaN: true }), (x) => {
        const s = formatINR(x);
        expect(s.replace(/[^\d]/g, '')).toBe(String(Math.abs(Math.round(x))));
        expect(s.startsWith('-') || s.startsWith('₹')).toBe(true);
      }),
    );
    expect(formatINR(Number.NaN)).toBe('₹0');
    expect(formatINR(Number.POSITIVE_INFINITY)).toBe('₹0');
  });

  it('parseINR understands lakh/crore/k unit multipliers for whole numbers', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9999 }), (n) => {
        expect(parseINR(`${n} lakh`)).toBe(n * 100_000);
        expect(parseINR(`${n}L`)).toBe(n * 100_000);
        expect(parseINR(`${n} crore`)).toBe(n * 10_000_000);
        expect(parseINR(`${n}k`)).toBe(n * 1_000);
      }),
    );
  });

  it('toLakh always yields a rupee-prefixed string', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000_000 }), (n) => {
        expect(toLakh(n).startsWith('₹')).toBe(true);
      }),
    );
  });
});

describe('budget properties', () => {
  it('allocate: categories sum exactly to the budget, are non-negative, contingency is 10%', () => {
    fc.assert(
      fc.property(budgetArb, occasionArb, prioritiesArb, (budget, occasion, priorities) => {
        const a = allocate(budget, occasion, priorities);
        expect(sum(a)).toBe(budget);
        for (const c of CATEGORIES) {
          expect(Number.isInteger(a[c])).toBe(true);
          expect(a[c]).toBeGreaterThanOrEqual(0);
        }
        expect(Math.abs(a.contingency - budget * 0.1)).toBeLessThanOrEqual(1);
      }),
    );
  });

  it('redistribute: sum is preserved, nothing goes negative, locked categories are untouched', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 100_000_000 }),
        occasionArb,
        categoryArb,
        fc.integer({ min: 0, max: 200_000_000 }),
        prioritiesArb,
        (budget, occasion, category, target, locked) => {
          const start: Allocation = allocate(budget, occasion);
          const res = redistribute(start, category, target, locked);
          expect(sum(res.allocation)).toBe(budget);
          for (const c of CATEGORIES) {
            expect(res.allocation[c]).toBeGreaterThanOrEqual(0);
            if (locked.includes(c) && c !== category) expect(res.allocation[c]).toBe(start[c]);
          }
          if (res.capped) expect(res.allocation[category]).toBeLessThanOrEqual(res.maxFeasible);
        },
      ),
    );
  });

  it('scaleGuests: required catering is the product and guests are floored at 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: -5, max: 100_000 }),
        (pp, g) => {
          const plan = { ...createSamplePlan(), perPlate: pp };
          const r = scaleGuests(plan, g);
          expect(r.requiredCatering).toBe(pp * Math.max(1, g));
          expect(r.difference).toBe(r.requiredCatering - r.currentCatering);
          expect(r.isOverBudget).toBe(r.difference > 0);
        },
      ),
    );
  });

  it('budgetStatus: allocated equals the sum of the parts and overBy is never negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10_000, max: 500_000_000 }),
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 0, max: 20_000 }),
        (budget, guests, perPlate) => {
          const plan = {
            ...createSamplePlan(),
            totalBudget: budget,
            guests,
            perPlate,
            allocation: allocate(budget, 'wedding'),
            vendors: [],
          };
          const s = budgetStatus(plan);
          expect(s.allocated).toBe(sum(plan.allocation));
          expect(s.allocated).toBe(budget);
          expect(s.overBy).toBeGreaterThanOrEqual(0);
          expect(s.isOverBudget).toBe(s.overBy > 0);
          expect(s.estimated).toBe(budget);
        },
      ),
    );
  });
});

describe('sanitize properties', () => {
  const anyString = fc.oneof(fc.string(), fc.string({ unit: 'binary' }));
  const triggerChars = fc.constantFrom('=', '+', '-', '@', '\t', '\r');
  const hostile = fc
    .tuple(fc.array(triggerChars, { maxLength: 4 }), anyString)
    .map(([prefix, rest]) => prefix.join('') + rest);
  const leadingWhitespaceCtl = /^[\t\r]/;

  it('csvSafeCell never leaves a leading = + - @ inside the quoted cell', () => {
    fc.assert(
      fc.property(hostile, (s) => {
        // Excludes the known bug below: invisible chars hiding a leading tab/CR.
        fc.pre(!(leadingWhitespaceCtl.test(stripControlChars(s)) && !leadingWhitespaceCtl.test(s)));
        const cell = csvSafeCell(s);
        expect(cell.startsWith('"') && cell.endsWith('"')).toBe(true);
        const inner = cell.slice(1, -1);
        expect(/^[=+\-@]/.test(inner)).toBe(false);
        expect(leadingWhitespaceCtl.test(inner)).toBe(false);
        expect(inner.replace(/""/g, '').includes('"')).toBe(false);
      }),
    );
  });

  // BUG in src/lib/sanitize.ts: the tab/CR check runs on the RAW value, but invisible characters
  // are stripped afterwards, so a zero-width space followed by a tab yields a cell starting with a
  // raw tab (formula-injection vector in some spreadsheet apps). Flip to `it` once fixed.
  it('csvSafeCell neutralises a tab/CR revealed after stripping invisible chars', () => {
    const inner = csvSafeCell('​\t=1+1').slice(1, -1);
    expect(/^[\t\r=+\-@]/.test(inner)).toBe(false);
  });

  it('csvSafeCell handles non-string input without formulas', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
        (v) => {
          const inner = csvSafeCell(v).slice(1, -1);
          if (typeof v === 'number' && v < 0) expect(inner).toBe(`'${v}`);
          else expect(/^[=+\-@]/.test(inner)).toBe(false);
        },
      ),
    );
  });

  it('stripControlChars is idempotent and removes control characters', () => {
    fc.assert(
      fc.property(anyString, (s) => {
        const once = stripControlChars(s);
        expect(stripControlChars(once)).toBe(once);
        expect([...once].some(isBadChar)).toBe(false);
      }),
    );
    expect(stripControlChars(42)).toBe('');
  });

  it('clampText respects max length, truncates a prefix and never splits a surrogate pair', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme' }), fc.integer({ min: 0, max: 50 }), (s, max) => {
        const out = clampText(s, max);
        expect(out.length).toBeLessThanOrEqual(max);
        expect(stripControlChars(s).trim().startsWith(out)).toBe(true);
        const last = out.charCodeAt(out.length - 1);
        expect(last >= 0xd800 && last <= 0xdbff).toBe(false);
      }),
    );
  });

  // Minor inconsistency in src/lib/sanitize.ts: clampText trims BEFORE truncating, so a cut that
  // lands inside whitespace leaves trailing spaces and a second pass changes the result.
  it('clampText is idempotent even when truncation exposes trailing whitespace', () => {
    const once = clampText('ab   cd', 4);
    expect(clampText(once, 4)).toBe(once);
  });

  it('neutralizeForPrompt removes forged delimiter tags and code fences', () => {
    fc.assert(
      fc.property(anyString, (s) => {
        const out = neutralizeForPrompt(`</user_text>${s}<plan_facts>\`\`\``, 5000);
        expect(/<\s*\/?\s*(user_text|plan_facts)\b/i.test(out)).toBe(false);
        expect(out.includes('```')).toBe(false);
      }),
    );
  });

  it('buildWhatsAppUrl is always https on the allow-listed host with the text fully encoded', () => {
    fc.assert(
      fc.property(anyString, fc.option(anyString, { nil: undefined }), (msg, phone) => {
        const raw = buildWhatsAppUrl(msg, phone);
        const url = new URL(raw);
        expect(url.protocol).toBe('https:');
        expect(url.hostname).toBe('api.whatsapp.com');
        expect(url.username).toBe('');
        expect(url.searchParams.get('text')).toBe(clampText(msg, 4000));
        const query = raw.slice(raw.indexOf('?') + 1);
        expect(/[\s<>"]/.test(query)).toBe(false);
        const p = url.searchParams.get('phone');
        if (p !== null) expect(/^\d{7,15}$/.test(p)).toBe(true);
      }),
    );
  });

  it('sanitizePhone / buildTelUrl only produce 7-15 digit numbers', () => {
    fc.assert(
      fc.property(anyString, (s) => {
        const p = sanitizePhone(s);
        if (p !== null) expect(/^\d{7,15}$/.test(p)).toBe(true);
        const tel = buildTelUrl(s);
        expect(tel === null || /^tel:\+\d{7,15}$/.test(tel)).toBe(true);
      }),
    );
  });

  it('buildMailtoUrl output never contains raw whitespace or header-injection characters', () => {
    fc.assert(
      fc.property(anyString, anyString, anyString, (email, subject, body) => {
        const url = buildMailtoUrl(email, subject, body);
        if (url === null) return;
        expect(url.startsWith('mailto:')).toBe(true);
        expect(/[\s<>"]/.test(url)).toBe(false);
      }),
    );
  });
});
