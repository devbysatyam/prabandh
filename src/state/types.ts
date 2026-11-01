import type {
  Category,
  Guest,
  Intake,
  PaymentMilestone,
  Plan,
  RunSheetItem,
  SiteVisit,
  StoredQuote,
  TaskStatus,
  Vendor,
  VendorMeeting,
  VenueDetail,
} from '../schemas';

/**
 * Every state transition the plan reducer understands (discriminated by `type`).
 *
 * @example
 * ```ts
 * const a: Action = { type: 'setBudget', budget: 1_500_000 };
 * ```
 */
export type Action =
  | { type: 'create'; intake: Intake }
  | { type: 'updateIntake'; intake: Intake }
  | { type: 'setBudget'; budget: number }
  | { type: 'setGuests'; guests: number }
  | { type: 'setAmount'; category: Category; amount: number }
  | { type: 'toggleLock'; category: Category }
  | { type: 'toggleContacted'; category: Category }
  | { type: 'setTaskStatus'; taskId: string; status: TaskStatus }
  | { type: 'setTaskDelay'; taskId: string; delayDays: number }
  | { type: 'addGuest'; guest: Guest }
  | { type: 'updateGuest'; guest: Guest }
  | { type: 'deleteGuest'; guestId: string }
  | { type: 'syncGuestsWithList'; useConfirmedOnly?: boolean }
  | { type: 'addVenue'; venue: VenueDetail }
  | { type: 'updateVenue'; venue: VenueDetail }
  | { type: 'deleteVenue'; venueId: string }
  | { type: 'addSiteVisit'; visit: SiteVisit }
  | { type: 'updateSiteVisit'; visit: SiteVisit }
  | { type: 'deleteSiteVisit'; visitId: string }
  | { type: 'addVendor'; vendor: Vendor }
  | { type: 'updateVendor'; vendor: Vendor }
  | { type: 'deleteVendor'; vendorId: string }
  | { type: 'addPayment'; vendorId: string; payment: PaymentMilestone }
  | { type: 'togglePayment'; vendorId: string; paymentId: string }
  | { type: 'addStoredQuote'; stored: StoredQuote }
  | { type: 'acceptStoredQuote'; quoteId: string }
  | { type: 'deleteStoredQuote'; quoteId: string }
  | { type: 'addVendorMeeting'; meeting: VendorMeeting }
  | { type: 'updateVendorMeeting'; meeting: VendorMeeting }
  | { type: 'deleteVendorMeeting'; meetingId: string }
  | { type: 'cycleRunSheet'; itemId: string }
  | { type: 'addRunSheetItem'; item: RunSheetItem }
  | { type: 'applyTradeoff'; optionId: 'reduce_guests' | 'trim_categories' | 'use_contingency' }
  | { type: 'loadPlan'; plan: Plan }
  | { type: 'loadSamplePlan' }
  | { type: 'dismissToast' }
  | { type: 'reset' };

/**
 * Transient notification shown by the app shell.
 *
 * @example
 * ```ts
 * const t: Toast = { message: 'Saved', type: 'success' };
 * ```
 */
export interface Toast {
  message: string;
  type: 'info' | 'success' | 'warn';
}

/**
 * Reducer state: the plan (or `null` before creation) and the pending toast.
 *
 * @example
 * ```ts
 * const s: PlanState = { plan: null, toast: null };
 * ```
 */
export interface PlanState {
  plan: Plan | null;
  toast: Toast | null;
}

/**
 * Result of a feature reducer: a new state, or `undefined` when the action is not handled.
 *
 * @example
 * ```ts
 * const noop: FeatureReducer = () => undefined;
 * ```
 */
export type FeatureReducer = (
  state: PlanState,
  plan: Plan,
  action: Action,
) => PlanState | undefined;
