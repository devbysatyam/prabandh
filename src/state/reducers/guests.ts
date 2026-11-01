import { syncGuestCountWithList } from '../../engine';
import type { FeatureReducer } from '../types';

/**
 * Guest list edits and headcount syncing.
 *
 * @param state - Current state.
 * @param p - The current plan (non-null).
 * @param action - Dispatched action.
 * @returns New state, or `undefined` when not handled.
 * @example
 * ```ts
 * guestsReducer(state, plan, { type: 'deleteGuest', guestId: 'g-1' });
 * ```
 */
export const guestsReducer: FeatureReducer = (state, p, action) => {
  switch (action.type) {
    case 'addGuest': {
      const guestList = [action.guest, ...p.guestList];
      return {
        ...state,
        plan: { ...p, guestList },
        toast: { message: `Added ${action.guest.name} to guest list.`, type: 'success' },
      };
    }

    case 'updateGuest': {
      const guestList = p.guestList.map((g) => (g.id === action.guest.id ? action.guest : g));
      return { ...state, plan: { ...p, guestList } };
    }

    case 'deleteGuest': {
      const guestList = p.guestList.filter((g) => g.id !== action.guestId);
      return { ...state, plan: { ...p, guestList } };
    }

    case 'syncGuestsWithList': {
      const updated = syncGuestCountWithList(p, action.useConfirmedOnly);
      return {
        ...state,
        plan: updated,
        toast: { message: `Target guest count synced to ${updated.guests}.`, type: 'success' },
      };
    }

    default:
      return undefined;
  }
};
