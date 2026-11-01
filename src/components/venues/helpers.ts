import type { CateringPolicy, SiteVisit, VenueDetail, VenueType } from '../../schemas';
import { newId } from '../../lib/ids';
import { FALLBACK_ATTENDEES, FALLBACK_VENUE_ID, FALLBACK_VENUE_NAME } from './constants';

/** Raw state of the "Add Venue" form. */
export interface VenueFormState {
  name: string;
  type: VenueType;
  capacityMin: number;
  capacityMax: number;
  rentalCost: number;
  cateringPolicy: CateringPolicy;
  alcoholAllowed: boolean;
  parkingCapacity: number;
  roomsIncluded: number;
  curfewTime: string;
  cautionDeposit: number;
  address: string;
  notes: string;
}

/** Raw state of the "Record Site Visit" form. */
export interface VisitFormState {
  venueId: string;
  visitDate: string;
  attendees: string;
  rating: number;
  acWorking: boolean;
  bridalRoomClean: boolean;
  soundCurfewOk: boolean;
  parkingAdequate: boolean;
  tastingDone: boolean;
  tastingNotes: string;
  notes: string;
}

/** Parse a numeric input value, treating blank as 0. */
export function parseIntField(raw: string): number {
  return parseInt(raw || '0', 10);
}

/** Build a shortlisted VenueDetail from form state, or null when the name is blank. */
export function buildVenue(f: VenueFormState): VenueDetail | null {
  if (!f.name.trim()) return null;
  return {
    id: newId('venue'),
    name: f.name.trim(),
    type: f.type,
    capacityMin: Math.max(0, f.capacityMin),
    capacityMax: Math.max(f.capacityMin, f.capacityMax),
    rentalCost: Math.max(0, f.rentalCost),
    cateringPolicy: f.cateringPolicy,
    alcoholAllowed: f.alcoholAllowed,
    parkingCapacity: Math.max(0, f.parkingCapacity),
    roomsIncluded: Math.max(0, f.roomsIncluded),
    curfewTime: f.curfewTime,
    cautionDeposit: Math.max(0, f.cautionDeposit),
    address: f.address.trim() || undefined,
    status: 'shortlisted',
    notes: f.notes.trim() || undefined,
  };
}

/** The venue a visit refers to: the selected one, else the first. */
export function visitTarget(
  venues: readonly VenueDetail[],
  venueId: string,
): VenueDetail | undefined {
  return venues.find((v) => v.id === venueId) ?? venues[0];
}

/** Build a completed SiteVisit from form state. */
export function buildSiteVisit(f: VisitFormState, venues: readonly VenueDetail[]): SiteVisit {
  const target = visitTarget(venues, f.venueId);
  return {
    id: newId('visit'),
    venueId: f.venueId || target?.id || FALLBACK_VENUE_ID,
    venueName: target ? target.name : FALLBACK_VENUE_NAME,
    visitDate: f.visitDate,
    attendees: f.attendees.trim() || FALLBACK_ATTENDEES,
    rating: f.rating,
    acWorking: f.acWorking,
    bridalRoomClean: f.bridalRoomClean,
    soundCurfewOk: f.soundCurfewOk,
    parkingAdequate: f.parkingAdequate,
    tastingDone: f.tastingDone,
    tastingNotes: f.tastingNotes.trim() || undefined,
    notes: f.notes.trim() || undefined,
    status: 'completed',
  };
}
