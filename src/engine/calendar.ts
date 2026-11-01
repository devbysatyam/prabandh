import type { ScheduledTask } from './timeline';
import type { RunSheetItem } from '../schemas';

function escapeIcsText(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  let folded = '';
  let remaining = line;
  while (remaining.length > 75) {
    folded += remaining.slice(0, 75) + '\r\n ';
    remaining = remaining.slice(75);
  }
  folded += remaining;
  return folded;
}

/**
 * Generates an RFC 5545 compliant .ics calendar file string containing all
 * event milestones, tasks, and day-of schedule.
 */
export function generateIcsCalendar(
  eventTitle: string,
  eventDate: string,
  tasks: ScheduledTask[],
  runSheet: RunSheetItem[] = [],
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Prabandh//Celebration Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(eventTitle)} Milestones`,
  ];

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  // Add tasks
  for (const t of tasks) {
    const dateFormatted = t.effectiveDate.replace(/-/g, '');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:task-${t.id}@prabandh.app`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dateFormatted}`);
    lines.push(`DTEND;VALUE=DATE:${dateFormatted}`);
    lines.push(`SUMMARY:${escapeIcsText(`[Prabandh] ${t.title}`)}`);
    lines.push(
      `DESCRIPTION:${escapeIcsText(
        `Category: ${t.category}\nStatus: ${t.status}\nAssignee: ${t.assignee ?? 'Unassigned'}\nDue: ${t.effectiveDate}`,
      )}`,
    );
    lines.push('END:VEVENT');
  }

  // Add day-of run-sheet items
  const baseEventDate = eventDate.replace(/-/g, '');
  for (const item of runSheet) {
    const timeClean = item.time.replace(':', '') + '00';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:runsheet-${item.id}@prabandh.app`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${baseEventDate}T${timeClean}`);
    lines.push(`DTEND:${baseEventDate}T${timeClean}`);
    lines.push(`SUMMARY:${escapeIcsText(`${eventTitle}: ${item.title}`)}`);
    lines.push(
      `DESCRIPTION:${escapeIcsText(
        `${item.description ?? ''}\nCoordinator: ${item.coordinator ?? 'Host Family'}`,
      )}`,
    );
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
