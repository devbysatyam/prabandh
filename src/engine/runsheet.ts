import type { RunSheetItem } from '../schemas';

/**
 * Sorts day-of run sheet chronologically by HH:MM military time.
 */
export function sortRunSheet(items: RunSheetItem[]): RunSheetItem[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Toggles a run-sheet item status: pending -> in_progress -> completed -> pending.
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
 * Formats full day-of itinerary into a WhatsApp broadcast message for family coordinators.
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
