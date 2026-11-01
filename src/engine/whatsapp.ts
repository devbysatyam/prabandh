import type { Plan } from '../schemas';
import { budgetStatus } from './budget';
import { aggregateGuests } from './guests';
import { formatINR } from './money';
import { buildSchedule, diffDays } from './timeline';

/**
 * Generates an executive WhatsApp update message ready to copy & share to the family group.
 */
export function generateFamilyWhatsappUpdate(plan: Plan, today: string): string {
  const daysLeft = diffDays(today, plan.eventDate);
  const status = budgetStatus(plan);
  const guestSummary = aggregateGuests(plan.guestList);
  const schedule = buildSchedule(plan.tasks, plan.eventDate, today);

  const pendingUrgentTasks = schedule
    .filter((t) => t.status !== 'done' && (t.isOverdue || t.daysRemaining <= 14))
    .slice(0, 3);

  const bookedVendors = plan.vendors.filter((v) => v.status === 'booked');

  let text = `🎉 *${plan.title} — Family Planning Update* 🎉\n`;
  text += `📅 *Date:* ${plan.eventDate} (${daysLeft > 0 ? `${daysLeft} days to go!` : 'Celebration Day!'})\n`;
  if (plan.city) text += `📍 *City:* ${plan.city}\n`;
  text += '\n';

  // Budget
  text += `💰 *Budget Summary:*\n`;
  text += `• Total Budget: ${formatINR(status.total)}\n`;
  text += `• Committed (Contracts): ${formatINR(status.committed)}\n`;
  if (status.isOverBudget) {
    text += `• ⚠️ *Over budget by ${formatINR(status.overBy)}* (Action needed!)\n`;
  } else {
    text += `• Remaining Buffer / Est: ${formatINR(status.total - status.committed)}\n`;
  }
  text += '\n';

  // Guests
  text += `👥 *Guest & RSVP Status:*\n`;
  text += `• Total Planning For: ${plan.guests} guests\n`;
  if (guestSummary.totalEntries > 0) {
    text += `• Confirmed RSVPs: ${guestSummary.confirmedCount} (${guestSummary.confirmationRate}%)\n`;
    text += `• Pending RSVPs: ${guestSummary.pendingCount}\n`;
    text += `• Veg / Jain / Non-Veg: ${guestSummary.byDiet.veg} / ${guestSummary.byDiet.jain} / ${guestSummary.byDiet.non_veg}\n`;
  }
  text += '\n';

  // Key Deadlines
  if (pendingUrgentTasks.length > 0) {
    text += `⏰ *Priority Tasks Due Now:*\n`;
    for (const t of pendingUrgentTasks) {
      const badge = t.isOverdue ? '⚠️ Overdue' : `Due in ${t.daysRemaining}d`;
      text += `• ${t.title} [${badge}]\n`;
    }
    text += '\n';
  }

  // Vendors
  text += `📋 *Vendors Locked:* ${bookedVendors.length} of ${plan.vendors.length} categories booked\n\n`;
  text += `Let's keep things on track! Shared via Prabandh · प्रबंध. 🙏`;

  return text;
}
