import type { DietPreference, GuestSide, RsvpStatus } from '../../schemas';

/** Form defaults and limits for the add-guest form. */
export const DEFAULT_ATTENDEE_COUNT = 2;
export const MIN_ATTENDEES = 1;
export const MAX_ATTENDEES = 50;

export const DEFAULT_SIDE: GuestSide = 'bride';
export const DEFAULT_RSVP: RsvpStatus = 'pending';
export const DEFAULT_DIET: DietPreference = 'veg';

/** Sentinel for "no filter" in the list filters. */
export const ALL = 'all';

export const SIDE_OPTIONS: readonly { value: GuestSide; label: string }[] = [
  { value: 'bride', label: 'Bride Side' },
  { value: 'groom', label: 'Groom Side' },
  { value: 'mutual', label: 'Mutual Friends' },
  { value: 'community', label: 'Community / Society' },
  { value: 'general', label: 'General' },
];

export const RSVP_OPTIONS: readonly { value: RsvpStatus; label: string }[] = [
  { value: 'pending', label: '⏳ Pending Response' },
  { value: 'confirmed', label: '✅ Confirmed' },
  { value: 'declined', label: '❌ Declined' },
];

export const DIET_OPTIONS: readonly { value: DietPreference; label: string }[] = [
  { value: 'veg', label: 'Pure Vegetarian' },
  { value: 'jain', label: 'Jain (No Root Veg)' },
  { value: 'non_veg', label: 'Non-Vegetarian' },
  { value: 'any', label: 'Any / Standard' },
];

/** Tailwind classes for the inline RSVP select, by status. */
export const RSVP_SELECT_CLASS: Record<RsvpStatus, string> = {
  confirmed:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
  declined: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
};
