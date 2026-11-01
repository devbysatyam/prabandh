import { describe, it, expect } from 'vitest';
import {
  addDays,
  diffDays,
  detectCycle,
  topologicalSort,
  buildSchedule,
  propagateDelay,
  compressTasks,
} from '../../src/engine/timeline';
import type { Task } from '../../src/schemas';

describe('timeline.ts', () => {
  it('adds and diffs days without time zone corruption', () => {
    expect(addDays('2026-10-01', 5)).toBe('2026-10-06');
    expect(addDays('2026-10-01', -5)).toBe('2026-09-26');
    expect(diffDays('2026-10-01', '2026-10-15')).toBe(14);
    expect(diffDays('2026-10-15', '2026-10-01')).toBe(-14);
  });

  it('detects cycles in dependency graphs', () => {
    const cleanTasks: Task[] = [
      { id: '1', title: 'A', category: 'venue', leadDays: 60, durationDays: 5, dependsOn: [], status: 'todo' },
      { id: '2', title: 'B', category: 'catering', leadDays: 45, durationDays: 5, dependsOn: ['1'], status: 'todo' },
    ];
    expect(detectCycle(cleanTasks)).toBeNull();

    const cyclicTasks: Task[] = [
      { id: '1', title: 'A', category: 'venue', leadDays: 60, durationDays: 5, dependsOn: ['2'], status: 'todo' },
      { id: '2', title: 'B', category: 'catering', leadDays: 45, durationDays: 5, dependsOn: ['1'], status: 'todo' },
    ];
    expect(detectCycle(cyclicTasks)).not.toBeNull();
  });

  it('sorts tasks topologically respecting dependencies', () => {
    const tasks: Task[] = [
      { id: '3', title: 'C', category: 'decor', leadDays: 30, durationDays: 5, dependsOn: ['2'], status: 'todo' },
      { id: '1', title: 'A', category: 'venue', leadDays: 90, durationDays: 5, dependsOn: [], status: 'todo' },
      { id: '2', title: 'B', category: 'catering', leadDays: 60, durationDays: 5, dependsOn: ['1'], status: 'todo' },
    ];
    const sorted = topologicalSort(tasks);
    const order = sorted.map((t) => t.id);
    expect(order.indexOf('1')).toBeLessThan(order.indexOf('2'));
    expect(order.indexOf('2')).toBeLessThan(order.indexOf('3'));
  });

  it('builds schedule and propagates delays to downstream tasks', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Venue', category: 'venue', leadDays: 100, durationDays: 10, dependsOn: [], status: 'todo', delayDays: 30 },
      { id: '2', title: 'Catering', category: 'catering', leadDays: 80, durationDays: 5, dependsOn: ['1'], status: 'todo' },
    ];
    const eventDate = '2026-12-01';
    const today = '2026-09-01';

    const schedule = buildSchedule(tasks, eventDate, today);
    expect(schedule.length).toBe(2);

    const venue = schedule.find((t) => t.id === '1')!;
    const catering = schedule.find((t) => t.id === '2')!;

    expect(venue.affectedByDelay).toBe(true);
    expect(diffDays(catering.effectiveDate, eventDate)).toBeGreaterThan(0);
  });

  it('propagates downstream delay IDs', () => {
    const tasks: Task[] = [
      { id: '1', title: 'A', category: 'venue', leadDays: 90, durationDays: 5, dependsOn: [], status: 'todo' },
      { id: '2', title: 'B', category: 'catering', leadDays: 60, durationDays: 5, dependsOn: ['1'], status: 'todo' },
      { id: '3', title: 'C', category: 'decor', leadDays: 30, durationDays: 5, dependsOn: ['2'], status: 'todo' },
    ];
    const affected = propagateDelay(tasks, '1', 15);
    expect(affected).toContain('2');
    expect(affected).toContain('3');
  });

  it('compresses tasks when available runway is shorter than nominal lead time', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Venue', category: 'venue', leadDays: 180, durationDays: 14, dependsOn: [], status: 'todo' },
      { id: '2', title: 'Catering', category: 'catering', leadDays: 120, durationDays: 10, dependsOn: [], status: 'todo' },
    ];
    // Only 60 days runway available
    const compressed = compressTasks(tasks, 60);
    const maxLead = Math.max(...compressed.map((t) => t.leadDays));
    expect(maxLead).toBeLessThanOrEqual(60);
    expect(compressed[0]!.leadDays).toBeGreaterThan(compressed[1]!.leadDays);
  });
});
