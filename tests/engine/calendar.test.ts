import { describe, it, expect } from 'vitest';
import { generateIcsCalendar } from '../../src/engine/calendar';
import { buildSchedule } from '../../src/engine/timeline';
import type { Task, RunSheetItem } from '../../src/schemas';

describe('calendar.ts', () => {
  it('generates compliant RFC 5545 ICS calendar string', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Lock Venue & Lawn', category: 'venue', leadDays: 90, durationDays: 7, dependsOn: [], status: 'todo' },
      { id: '2', title: 'Book Master Caterer', category: 'catering', leadDays: 60, durationDays: 5, dependsOn: ['1'], status: 'todo' },
    ];
    const runSheet: RunSheetItem[] = [
      { id: 'rs1', time: '17:30', title: 'Varmala Ceremony', description: 'Central Stage', coordinator: 'Mami', status: 'pending' },
    ];

    const schedule = buildSchedule(tasks, '2026-12-25', '2026-10-01');
    const ics = generateIcsCalendar('Grand Shaadi', '2026-12-25', schedule, runSheet);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Prabandh//Celebration Planner//EN');
    expect(ics).toContain('SUMMARY:[Prabandh] Lock Venue & Lawn');
    expect(ics).toContain('SUMMARY:Grand Shaadi: Varmala Ceremony');
    expect(ics).toContain('END:VCALENDAR');
  });
});
