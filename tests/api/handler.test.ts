import { describe, it, expect } from 'vitest';
import { handleApiRequest } from '../../src/api/handler';
import { allocate } from '../../src/engine/budget';
import type { Plan } from '../../src/schemas';

describe('api/handler.ts', () => {
  const dummyPlan: Plan = {
    id: 'test-1',
    version: 1,
    title: 'Pune Shaadi',
    occasion: 'wedding',
    eventDate: '2026-12-20',
    totalBudget: 1200000,
    guests: 200,
    vibe: 'Royal feast',
    priorities: ['catering'],
    priorityKeys: [],
    allocation: allocate(1200000, 'wedding'),
    locked: [],
    contacted: [],
    perPlate: 1800,
    tasks: [],
    guestList: [],
    vendors: [],
    venues: [],
    siteVisits: [],
    quotes: [],
    vendorMeetings: [],
    runSheet: [],
  };

  it('handles parse-intake with deterministic fallback', async () => {
    const res = await handleApiRequest(
      'parse-intake',
      {
        text: 'Grand Wedding in Pune, 200 guests, 15 lakh budget, premium catering and photography',
      },
      'POST',
    );
    expect(res.status).toBe(200);
    expect(res.data.occasion).toBe('wedding');
    expect(res.data.totalBudget).toBe(1500000);
    expect(res.data.guests).toBe(200);
    expect(res.data.city).toBe('Pune');
    expect(res.data.priorities).toContain('catering');
  });

  it('correctly parses user celebration prompt with date, kids birthday, budget and sub-locality', async () => {
    const userPrompt = `hey i want to make a  celebration of 150 guest birthday part in new delhi mayur vihar 
 on  15 /01/2027 kids party theme
budget is 50000`;
    const res = await handleApiRequest('parse-intake', { text: userPrompt }, 'POST');
    expect(res.status).toBe(200);
    expect(res.data.occasion).toBe('kids_birthday');
    expect(res.data.totalBudget).toBe(50000);
    expect(res.data.guests).toBe(150);
    expect(res.data.eventDate).toBe('2027-01-15');
    expect(res.data.city).toContain('New Delhi');
    expect(res.data.priorities).toContain('decor');
  });

  it('prevents false matching of year and words (e.g. 2027 kids does not match 2027 k)', async () => {
    const trickyPrompt =
      'Birthday for my daughter on 2027-02-20 with 80 guests. Total budget is 65000 with balloon decor';
    const res = await handleApiRequest('parse-intake', { text: trickyPrompt }, 'POST');
    expect(res.status).toBe(200);
    expect(res.data.totalBudget).toBe(65000);
    expect(res.data.guests).toBe(80);
    expect(res.data.eventDate).toBe('2027-02-20');
  });

  it('handles extract-quote with regex fallback', async () => {
    const res = await handleApiRequest(
      'extract-quote',
      {
        text: 'Royal Caterers\nRs. 1500 per plate, minimum 250 plates, 50% advance, + 18% GST extra.',
        category: 'catering',
      },
      'POST',
    );
    expect(res.status).toBe(200);
    expect(res.data.pricePerPlate).toBe(1500);
    expect(res.data.guestMinimum).toBe(250);
    expect(res.data.advancePercent).toBe(50);
    expect(res.data.taxIncluded).toBe(false);
  });

  it('handles ask-copilot answering grounded questions', async () => {
    const res = await handleApiRequest(
      'ask-copilot',
      { question: 'Are we over budget?', plan: dummyPlan },
      'POST',
    );
    expect(res.status).toBe(200);
    expect(res.data.answer).toBeDefined();
    expect(typeof res.data.answer).toBe('string');
  });

  it('handles suggest-ideas providing tailored concepts', async () => {
    const res = await handleApiRequest(
      'suggest-ideas',
      { occasion: 'wedding', vibe: 'Traditional Marigold' },
      'POST',
    );
    expect(res.status).toBe(200);
    expect((res.data['themes'] as unknown[]).length).toBeGreaterThan(0);
    expect((res.data['foodStyle'] as unknown[]).length).toBeGreaterThan(0);
    expect(res.data.invitationLine).toBeDefined();
  });

  it('handles review-plan providing health score and risks', async () => {
    const res = await handleApiRequest('review-plan', { plan: dummyPlan }, 'POST');
    expect(res.status).toBe(200);
    expect(res.data.healthScore).toBeGreaterThanOrEqual(0);
    expect(res.data.summary).toBeDefined();
  });

  it('returns 404 for unknown endpoints', async () => {
    const res = await handleApiRequest('non-existent', {}, 'POST');
    expect(res.status).toBe(404);
  });
});
