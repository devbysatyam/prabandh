import type {
  Category,
  PaymentMilestone,
  Plan,
  Quote,
  StoredQuote,
  Vendor,
  VendorMeeting,
} from '../../schemas';
import { effectiveQuoteCost } from '../../engine/vendors';
import { OCCASION_LABELS } from '../../engine/presets';
import { newId } from '../../lib/ids';
import { isoToday } from '../../state/planFactory';
import {
  DEFAULT_ADVANCE_PERCENT,
  FALLBACK_MEETING_ATTENDEES,
  FALLBACK_MEETING_FEEDBACK,
  FALLBACK_MEETING_VENDOR_NAME,
  MIN_MILESTONE_AMOUNT,
  PERCENT,
} from './constants';

/** Human label for a category, tailored to the occasion. */
export function categoryLabel(occasion: Plan['occasion'], category: Category): string {
  return OCCASION_LABELS[occasion][category] ?? category;
}

/** Booking-token + final-balance payment schedule derived from an accepted quote. */
export function buildBookingPayments(quote: Quote, plan: Plan): PaymentMilestone[] {
  const cost = effectiveQuoteCost(quote, plan.guests);
  const advancePct = quote.advancePercent ?? DEFAULT_ADVANCE_PERCENT;
  const advance = Math.round((cost * advancePct) / PERCENT);
  return [
    {
      id: newId('pm-1'),
      title: `Booking Token (${advancePct}%)`,
      amount: advance,
      dueDate: isoToday(),
      status: 'pending',
    },
    {
      id: newId('pm-2'),
      title: 'Final Balance on Event Day',
      amount: cost - advance,
      dueDate: plan.eventDate,
      status: 'pending',
    },
  ];
}

/** A booked vendor created from an accepted quote. */
export function buildBookedVendor(quote: Quote, plan: Plan): Vendor {
  return {
    id: newId('v'),
    name: quote.vendorName || `Locked ${quote.category.toUpperCase()} Vendor`,
    category: quote.category,
    status: 'booked',
    quote,
    payments: buildBookingPayments(quote, plan),
  };
}

/** Wrap a quote for storage in the comparison matrix. */
export function buildStoredQuote(quote: Quote, accepted: boolean): StoredQuote {
  return { id: newId('sq'), category: quote.category, quote, accepted };
}

/** A shortlisted vendor added by hand. */
export function buildManualVendor(name: string, category: Category, phone: string): Vendor {
  return {
    id: newId('v'),
    name: name.trim(),
    category,
    status: 'shortlisted',
    phone: phone.trim() || undefined,
    payments: [],
  };
}

/** A pending payment milestone (amount floored at the minimum). */
export function buildMilestone(title: string, amount: number, dueDate: string): PaymentMilestone {
  return {
    id: newId('pm'),
    title,
    amount: Math.max(MIN_MILESTONE_AMOUNT, amount),
    dueDate,
    status: 'pending',
  };
}

/** Editable fields of the tasting / trial form. */
export interface MeetingDraft {
  vendorId: string;
  vendorName: string;
  category: Category;
  meetingDate: string;
  meetingType: VendorMeeting['meetingType'];
  attendees: string;
  rating: number;
  dishes: string;
  feedback: string;
}

/** A completed tasting / trial meeting from the form draft (with fallbacks for blanks). */
export function buildMeeting(d: MeetingDraft): VendorMeeting {
  return {
    id: newId('vm'),
    vendorId: d.vendorId,
    vendorName: d.vendorName.trim() || FALLBACK_MEETING_VENDOR_NAME,
    category: d.category,
    meetingDate: d.meetingDate,
    meetingType: d.meetingType,
    attendees: d.attendees.trim() || FALLBACK_MEETING_ATTENDEES,
    rating: d.rating,
    dishesOrItemsTested: d.dishes.trim() || undefined,
    feedback: d.feedback.trim() || FALLBACK_MEETING_FEEDBACK,
    status: 'completed',
  };
}

/** Tailwind classes for a sourcing-status pill. */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'booked':
      return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800';
    case 'quoted':
      return 'bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-200 border border-brand-300 dark:border-brand-800';
    case 'contacted':
      return 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-800';
    default:
      return 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400';
  }
}
