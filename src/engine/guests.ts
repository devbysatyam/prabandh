import type { DietPreference, Guest, GuestSide, Plan } from '../schemas';

export interface GuestSummary {
  totalEntries: number;
  totalInvitedCount: number;
  confirmedCount: number;
  pendingCount: number;
  declinedCount: number;
  bySide: Record<GuestSide, number>;
  byDiet: Record<DietPreference, number>;
  confirmationRate: number; // 0 to 100 percentage
}

/**
 * Aggregates guest headcount, RSVP statuses, family sides, and dietary needs.
 */
export function aggregateGuests(guestList: Guest[]): GuestSummary {
  let totalInvitedCount = 0;
  let confirmedCount = 0;
  let pendingCount = 0;
  let declinedCount = 0;

  const bySide: Record<GuestSide, number> = {
    bride: 0,
    groom: 0,
    mutual: 0,
    community: 0,
    general: 0,
  };

  const byDiet: Record<DietPreference, number> = {
    veg: 0,
    jain: 0,
    non_veg: 0,
    any: 0,
  };

  for (const g of guestList) {
    const count = Math.max(1, g.count);
    totalInvitedCount += count;

    if (g.rsvp === 'confirmed') confirmedCount += count;
    else if (g.rsvp === 'declined') declinedCount += count;
    else pendingCount += count;

    bySide[g.side] = (bySide[g.side] ?? 0) + count;
    byDiet[g.diet] = (byDiet[g.diet] ?? 0) + count;
  }

  const confirmationRate =
    totalInvitedCount > 0 ? Math.round((confirmedCount / totalInvitedCount) * 100) : 0;

  return {
    totalEntries: guestList.length,
    totalInvitedCount,
    confirmedCount,
    pendingCount,
    declinedCount,
    bySide,
    byDiet,
    confirmationRate,
  };
}

/**
 * Synchronizes the plan's master guest headcount with the guest list.
 * If useConfirmedOnly is true, uses confirmed guests; otherwise uses (confirmed + pending).
 */
export function syncGuestCountWithList(plan: Plan, useConfirmedOnly = false): Plan {
  const summary = aggregateGuests(plan.guestList);
  const activeCount = useConfirmedOnly
    ? summary.confirmedCount
    : summary.confirmedCount + summary.pendingCount;

  // If list is empty, preserve existing plan.guests
  if (plan.guestList.length === 0 || activeCount === 0) {
    return plan;
  }

  return {
    ...plan,
    guests: activeCount,
  };
}

/**
 * Generates ready-to-send WhatsApp invite / RSVP follow-up text for a guest.
 */
export function formatGuestWhatsappInvite(
  guest: Guest,
  plan: Plan,
): string {
  const name = guest.name;
  const countText = guest.count > 1 ? ` (${guest.count} guests)` : '';
  const dateFormatted = new Date(plan.eventDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `Namaste ${name}! 🙏\n\nWe would be overjoyed to have you and your family join us for ${plan.title} on ${dateFormatted}${plan.city ? ` in ${plan.city}` : ''}.\n\nWe have currently reserved ${guest.count} seat(s)${countText} for your family. Please let us know your RSVP and any dietary preferences so we can ensure everything is warmly arranged for you.\n\nWarm regards,\nHost Family`;
}
