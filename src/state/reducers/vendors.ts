import type { PaymentMilestone } from '../../schemas';
import { isoToday } from '../planFactory';
import type { FeatureReducer } from '../types';

/** Vendor records and their payment milestones. */
const vendorRecordsReducer: FeatureReducer = (state, p, action) => {
  switch (action.type) {
    case 'addVendor': {
      const vendors = [...p.vendors, action.vendor];
      return { ...state, plan: { ...p, vendors } };
    }

    case 'updateVendor': {
      const vendors = p.vendors.map((v) => (v.id === action.vendor.id ? action.vendor : v));
      return { ...state, plan: { ...p, vendors } };
    }

    case 'deleteVendor': {
      const vendors = p.vendors.filter((v) => v.id !== action.vendorId);
      return { ...state, plan: { ...p, vendors } };
    }

    case 'addPayment': {
      const vendors = p.vendors.map((v) => {
        if (v.id !== action.vendorId) return v;
        return {
          ...v,
          payments: [...v.payments, action.payment],
        };
      });
      return {
        ...state,
        plan: { ...p, vendors },
        toast: { message: 'Payment milestone added.', type: 'success' },
      };
    }

    case 'togglePayment': {
      const vendors = p.vendors.map((v) => {
        if (v.id !== action.vendorId) return v;
        const payments = v.payments.map((pm) => {
          if (pm.id !== action.paymentId) return pm;
          const nextStatus: PaymentMilestone['status'] = pm.status === 'paid' ? 'pending' : 'paid';
          return {
            ...pm,
            status: nextStatus,
            paidDate: nextStatus === 'paid' ? isoToday() : undefined,
          };
        });
        return { ...v, payments };
      });
      return { ...state, plan: { ...p, vendors } };
    }

    default:
      return undefined;
  }
};

/** Stored quotes (compare / accept). */
const storedQuotesReducer: FeatureReducer = (state, p, action) => {
  switch (action.type) {
    case 'addStoredQuote': {
      const quotes = [...(p.quotes ?? []), action.stored];
      return {
        ...state,
        plan: { ...p, quotes },
        toast: { message: 'Quotation saved for comparison.', type: 'success' },
      };
    }

    case 'acceptStoredQuote': {
      const quotes = (p.quotes ?? []).map((q) => ({
        ...q,
        accepted: q.id === action.quoteId,
      }));
      return {
        ...state,
        plan: { ...p, quotes },
        toast: { message: 'Quotation accepted and marked verified!', type: 'success' },
      };
    }

    case 'deleteStoredQuote': {
      const quotes = (p.quotes ?? []).filter((q) => q.id !== action.quoteId);
      return { ...state, plan: { ...p, quotes } };
    }

    default:
      return undefined;
  }
};

/** Vendor meetings / tastings. */
const meetingsReducer: FeatureReducer = (state, p, action) => {
  switch (action.type) {
    case 'addVendorMeeting': {
      const vendorMeetings = [...(p.vendorMeetings ?? []), action.meeting];
      return {
        ...state,
        plan: { ...p, vendorMeetings },
        toast: {
          message: `Logged tasting/meeting with "${action.meeting.vendorName}".`,
          type: 'success',
        },
      };
    }

    case 'updateVendorMeeting': {
      const vendorMeetings = (p.vendorMeetings ?? []).map((m) =>
        m.id === action.meeting.id ? action.meeting : m,
      );
      return { ...state, plan: { ...p, vendorMeetings } };
    }

    case 'deleteVendorMeeting': {
      const vendorMeetings = (p.vendorMeetings ?? []).filter((m) => m.id !== action.meetingId);
      return { ...state, plan: { ...p, vendorMeetings } };
    }

    default:
      return undefined;
  }
};

/**
 * Vendors, payments, stored quotes and vendor meetings.
 *
 * @param state - Current state.
 * @param p - The current plan (non-null).
 * @param action - Dispatched action.
 * @returns New state, or `undefined` when not handled.
 * @example
 * ```ts
 * vendorsReducer(state, plan, { type: 'deleteVendor', vendorId: 'v-1' });
 * ```
 */
export const vendorsReducer: FeatureReducer = (state, p, action) =>
  vendorRecordsReducer(state, p, action) ??
  storedQuotesReducer(state, p, action) ??
  meetingsReducer(state, p, action);
