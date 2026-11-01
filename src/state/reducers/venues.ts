import type { FeatureReducer } from '../types';

/** Venue shortlist records. */
const venueRecordsReducer: FeatureReducer = (state, p, action) => {
  switch (action.type) {
    case 'addVenue': {
      const venues = [...(p.venues ?? []), action.venue];
      return {
        ...state,
        plan: { ...p, venues },
        toast: { message: `Added venue "${action.venue.name}".`, type: 'success' },
      };
    }

    case 'updateVenue': {
      const venues = (p.venues ?? []).map((v) => (v.id === action.venue.id ? action.venue : v));
      return { ...state, plan: { ...p, venues } };
    }

    case 'deleteVenue': {
      const venues = (p.venues ?? []).filter((v) => v.id !== action.venueId);
      return { ...state, plan: { ...p, venues } };
    }

    default:
      return undefined;
  }
};

/** Site-visit (recce) log. */
const siteVisitsReducer: FeatureReducer = (state, p, action) => {
  switch (action.type) {
    case 'addSiteVisit': {
      const siteVisits = [...(p.siteVisits ?? []), action.visit];
      return {
        ...state,
        plan: { ...p, siteVisits },
        toast: { message: `Logged site visit to "${action.visit.venueName}".`, type: 'success' },
      };
    }

    case 'updateSiteVisit': {
      const siteVisits = (p.siteVisits ?? []).map((v) =>
        v.id === action.visit.id ? action.visit : v,
      );
      return { ...state, plan: { ...p, siteVisits } };
    }

    case 'deleteSiteVisit': {
      const siteVisits = (p.siteVisits ?? []).filter((v) => v.id !== action.visitId);
      return { ...state, plan: { ...p, siteVisits } };
    }

    default:
      return undefined;
  }
};

/**
 * Venues and site visits.
 *
 * @param state - Current state.
 * @param p - The current plan (non-null).
 * @param action - Dispatched action.
 * @returns New state, or `undefined` when not handled.
 * @example
 * ```ts
 * venuesReducer(state, plan, { type: 'deleteVenue', venueId: 'venue-1' });
 * ```
 */
export const venuesReducer: FeatureReducer = (state, p, action) =>
  venueRecordsReducer(state, p, action) ?? siteVisitsReducer(state, p, action);
