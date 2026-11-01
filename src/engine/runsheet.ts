import type { RunSheetItem } from '../schemas';

/**
 * Sorts the day-of run sheet chronologically by `HH:MM` time (does not mutate the input).
 *
 * @param items - Run-sheet items.
 * @returns A new, time-ordered array.
 * @example
 * ```ts
 * sortRunSheet(items).map((i) => i.time); // => ['07:00', '09:30', '18:00']
 * ```
 */
export function sortRunSheet(items: RunSheetItem[]): RunSheetItem[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Advances one item through pending -> in_progress -> completed -> pending.
 *
 * @param items - Run-sheet items.
 * @param itemId - Id of the item to advance.
 * @returns A new array; other items are untouched.
 * @example
 * ```ts
 * cycleRunSheetStatus(items, 'r-1').find((i) => i.id === 'r-1')?.status; // => 'in_progress'
 * ```
 */
export function cycleRunSheetStatus(items: RunSheetItem[], itemId: string): RunSheetItem[] {
  return items.map((item) => {
    if (item.id !== itemId) return item;
    let nextStatus: RunSheetItem['status'] = 'in_progress';
    if (item.status === 'in_progress') nextStatus = 'completed';
    else if (item.status === 'completed') nextStatus = 'pending';
    return { ...item, status: nextStatus };
  });
}

/**
 * Formats the day-of itinerary as a WhatsApp broadcast for family coordinators.
 *
 * @param items - Run-sheet items (sorted internally).
 * @param eventTitle - Event title for the heading.
 * @param eventDate - Event date (YYYY-MM-DD).
 * @returns Multi-line message with status icons, times, leads and notes.
 * @example
 * ```ts
 * formatRunSheetWhatsapp(items, 'Wedding', '2027-02-14').includes('Day-of Master Itinerary'); // => true
 * ```
 */
export function formatRunSheetWhatsapp(
  items: RunSheetItem[],
  eventTitle: string,
  eventDate: string,
): string {
  const sorted = sortRunSheet(items);
  let msg = `📅 *${eventTitle} — Day-of Master Itinerary*\nDate: ${eventDate}\n\n`;

  for (const item of sorted) {
    const icon = item.status === 'completed' ? '✅' : item.status === 'in_progress' ? '⏳' : '📌';
    msg += `${icon} *${item.time}* — ${item.title}\n`;
    if (item.coordinator) msg += `   👤 Lead: ${item.coordinator}\n`;
    if (item.description) msg += `   ℹ️ ${item.description}\n`;
    msg += '\n';
  }

  msg +=
    'Please coordinate with designated family leads for any schedule updates. Have a wonderful celebration! 🎉';
  return msg;
}
