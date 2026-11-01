import { describe, it, expect } from 'vitest';
import { handleApiRequest } from '../../src/api/handler';

describe('api/routes.test.ts', () => {
  it('handles suggest-ideas route returning authentic Indian celebration themes', async () => {
    const res = await handleApiRequest(
      'suggest-ideas',
      { occasion: 'wedding', vibe: 'Royal Palace', guests: 250 },
      'POST',
    );
    expect(res.status).toBe(200);
    expect(res.data.themes.length).toBeGreaterThan(0);
    expect(res.data.activities.length).toBeGreaterThan(0);
  });

  it('handles review-plan route returning readiness score and action items', async () => {
    const res = await handleApiRequest(
      'review-plan',
      {
        plan: {
          id: 'p-rev-1',
          version: 1,
          title: 'Delhi Shaadi',
          occasion: 'wedding',
          eventDate: '2026-12-30',
          totalBudget: 1500000,
          guests: 200,
          vibe: 'Traditional',
          priorities: ['catering'],
          priorityKeys: ['catering'],
          allocation: {
            venue: 450000,
            catering: 550000,
            decor: 150000,
            photography: 120000,
            entertainment: 80000,
            misc: 0,
            contingency: 150000,
          },
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
        },
      },
      'POST',
    );
    expect(res.status).toBe(200);
    expect(res.data.healthScore).toBeGreaterThanOrEqual(50);
  });
});
