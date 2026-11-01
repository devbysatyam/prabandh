import { describe, it, expect } from 'vitest';
import {
  sortRunSheet,
  cycleRunSheetStatus,
  formatRunSheetWhatsapp,
} from '../../src/engine/runsheet';
import type { RunSheetItem } from '../../src/schemas';

describe('runsheet.ts', () => {
  const sampleItems: RunSheetItem[] = [
    { id: '1', time: '17:30', title: 'Varmala', status: 'pending', coordinator: 'Uncle R' },
    { id: '2', time: '11:00', title: 'Haldi', status: 'pending', coordinator: 'Mami' },
    { id: '3', time: '20:30', title: 'Dinner', status: 'pending', coordinator: 'Caterer' },
  ];

  it('sorts run-sheet items chronologically by time', () => {
    const sorted = sortRunSheet(sampleItems);
    expect(sorted[0]?.time).toBe('11:00');
    expect(sorted[1]?.time).toBe('17:30');
    expect(sorted[2]?.time).toBe('20:30');
  });

  it('cycles run-sheet status: pending -> in_progress -> completed -> pending', () => {
    let list = sampleItems;
    list = cycleRunSheetStatus(list, '1');
    expect(list.find((i) => i.id === '1')?.status).toBe('in_progress');

    list = cycleRunSheetStatus(list, '1');
    expect(list.find((i) => i.id === '1')?.status).toBe('completed');

    list = cycleRunSheetStatus(list, '1');
    expect(list.find((i) => i.id === '1')?.status).toBe('pending');
  });

  it('formats full day-of itinerary into WhatsApp broadcast message', () => {
    const text = formatRunSheetWhatsapp(sampleItems, 'Grand Shaadi', '2026-12-25');
    expect(text).toContain('Grand Shaadi — Day-of Master Itinerary');
    expect(text).toContain('11:00');
    expect(text).toContain('Haldi');
    expect(text).toContain('Uncle R');
  });
});
