import type { DietPreference, Guest, GuestSide, RsvpStatus } from '../../schemas';
import { newId } from '../../lib/ids';
import { ALL, MIN_ATTENDEES } from './constants';

/** Raw values of the add-guest form. */
export interface GuestDraft {
  name: string;
  count: number;
  side: GuestSide;
  rsvp: RsvpStatus;
  diet: DietPreference;
  phone: string;
  notes: string;
}

/** Build a normalised Guest from the form draft (trims text, clamps the count). */
export function buildGuest(draft: GuestDraft): Guest {
  return {
    id: newId('g'),
    name: draft.name.trim(),
    count: Math.max(MIN_ATTENDEES, draft.count),
    side: draft.side,
    rsvp: draft.rsvp,
    diet: draft.diet,
    phone: draft.phone.trim() || undefined,
    notes: draft.notes.trim() || undefined,
  };
}

/** Filter guests by side, RSVP status and a free-text search over name, phone and notes. */
export function filterGuests(
  guests: readonly Guest[],
  sideFilter: string,
  rsvpFilter: string,
  search: string,
): Guest[] {
  const query = search.trim() ? search.toLowerCase() : '';
  return guests.filter((g) => {
    if (sideFilter !== ALL && g.side !== sideFilter) return false;
    if (rsvpFilter !== ALL && g.rsvp !== rsvpFilter) return false;
    if (!query) return true;
    return (
      g.name.toLowerCase().includes(query) ||
      Boolean(g.phone?.includes(query)) ||
      Boolean(g.notes?.toLowerCase().includes(query))
    );
  });
}
