import type { CateringPolicy, VenueType } from '../../schemas';

/** Defaults pre-filled in the "Add Venue" form. */
export const VENUE_FORM_DEFAULTS = {
  type: 'banquet_hall' as VenueType,
  capacityMin: 100,
  capacityMax: 500,
  rentalCost: 300_000,
  cateringPolicy: 'external_allowed' as CateringPolicy,
  parkingCapacity: 100,
  roomsIncluded: 2,
  curfewTime: '23:00',
  cautionDeposit: 25_000,
} as const;

/** Defaults pre-filled in the "Record Site Visit" form. */
export const VISIT_FORM_DEFAULTS = {
  attendees: "Groom's Parents & Uncle",
  rating: 5,
} as const;

/** Fallbacks used when optional form text is left blank. */
export const FALLBACK_ATTENDEES = 'Family Members';
export const FALLBACK_VENUE_NAME = 'Selected Venue';
export const FALLBACK_VENUE_ID = 'v-1';

/** Highest site-visit star rating. */
export const MAX_RATING = 5;

export type VenueSubView = 'properties' | 'visits';

export const VENUE_TYPE_OPTIONS: readonly { value: VenueType; label: string }[] = [
  { value: 'banquet_hall', label: 'Banquet Hall (Indoor AC)' },
  { value: 'outdoor_lawn', label: 'Outdoor Open Lawn' },
  { value: 'heritage_resort', label: 'Heritage Palace / Resort' },
  { value: 'hotel_ballroom', label: '5-Star Hotel Ballroom' },
  { value: 'community_hall', label: 'Community Hall / Pandal' },
];

export const CATERING_POLICY_OPTIONS: readonly { value: CateringPolicy; label: string }[] = [
  { value: 'external_allowed', label: 'Outside Caterers Allowed' },
  { value: 'in_house_mandatory', label: 'In-House Catering Mandatory' },
  { value: 'royalty_fee', label: 'Outside with Royalty Fee' },
];

export const RATING_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 5, label: '★★★★★ (5/5)' },
  { value: 4, label: '★★★★☆ (4/5)' },
  { value: 3, label: '★★★☆☆ (3/5)' },
  { value: 2, label: '★★☆☆☆ (2/5)' },
  { value: 1, label: '★☆☆☆☆ (1/5)' },
];
