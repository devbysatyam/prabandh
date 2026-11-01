import type { Category } from '../../schemas';

/** Sub-views of the Vendors tab. */
export type SubView = 'checklist' | 'comparison' | 'tastings' | 'booked';

/** Advance percentage assumed when a quote does not state one. */
export const DEFAULT_ADVANCE_PERCENT = 30;
/** Default amount (rupees) pre-filled in the "add milestone" form. */
export const DEFAULT_MILESTONE_AMOUNT = 50_000;
/** Default title pre-filled in the "add milestone" form. */
export const DEFAULT_MILESTONE_TITLE = 'Token Advance (25%)';
/** Smallest payable milestone amount in rupees. */
export const MIN_MILESTONE_AMOUNT = 1;
/** Maximum star rating for a tasting / trial. */
export const MAX_RATING = 5;
/** Percent divisor. */
export const PERCENT = 100;

export const DEFAULT_MEETING_VENDOR_ID = 'v-caterer';
export const DEFAULT_MEETING_VENDOR_NAME = 'Master Caterers';
export const DEFAULT_MEETING_ATTENDEES = 'Both Families & Key Decision Makers';
export const DEFAULT_MEETING_DISHES =
  'Paneer Lababdar, Dal Bukhara, Angoori Gulab Jamun, Live Chaat';
export const DEFAULT_MEETING_FEEDBACK =
  'Food quality was rich and authentic. Requested slightly milder spice in Dal Makhani for elderly guests.';
export const FALLBACK_MEETING_VENDOR_NAME = 'Selected Vendor';
export const FALLBACK_MEETING_ATTENDEES = 'Family Members';
export const FALLBACK_MEETING_FEEDBACK = 'Meeting completed satisfactorily.';

/** Category pre-selected in pickers. */
export const DEFAULT_CATEGORY: Category = 'catering';

/** Rating options for the tasting form, highest first. */
export const RATING_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 5, label: '★★★★★ (5/5 Excellent)' },
  { value: 4, label: '★★★★☆ (4/5 Very Good)' },
  { value: 3, label: '★★★☆☆ (3/5 Average)' },
  { value: 2, label: '★★☆☆☆ (2/5 Needs Changes)' },
  { value: 1, label: '★☆☆☆☆ (1/5 Unsatisfactory)' },
];
