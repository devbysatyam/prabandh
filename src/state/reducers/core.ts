import { allocate, applyOption, redistribute } from '../../engine';
import type { Plan } from '../../schemas';
import { DEFAULT_PER_PLATE } from '../planFactory';
import type { FeatureReducer } from '../types';

const MIN_GUESTS = 1;

/** Budget, guest-count and category lock/contact toggles. */
const budgetReducer: FeatureReducer = (state, p, action) => {
  switch (action.type) {
    case 'setBudget': {
      const newAlloc = allocate(action.budget, p.occasion, p.priorities);
      return {
        ...state,
        plan: {
          ...p,
          totalBudget: action.budget,
          allocation: newAlloc,
        },
        toast: { message: 'Total budget updated and re-allocated.', type: 'info' },
      };
    }

    case 'setGuests': {
      const newGuests = Math.max(MIN_GUESTS, action.guests);
      return {
        ...state,
        plan: {
          ...p,
          guests: newGuests,
        },
        toast: { message: `Guest count updated to ${newGuests}.`, type: 'info' },
      };
    }

    case 'setAmount': {
      const res = redistribute(p.allocation, action.category, action.amount, p.locked);
      return {
        ...state,
        plan: {
          ...p,
          allocation: res.allocation,
        },
        toast: res.capped
          ? { message: 'Reached maximum feasible limit for category.', type: 'warn' }
          : null,
      };
    }

    case 'toggleLock': {
      const isLocked = p.locked.includes(action.category);
      const locked = isLocked
        ? p.locked.filter((c) => c !== action.category)
        : [...p.locked, action.category];
      return {
        ...state,
        plan: { ...p, locked },
        toast: {
          message: `${action.category} category is now ${isLocked ? 'unlocked' : 'locked'}.`,
          type: 'info',
        },
      };
    }

    case 'toggleContacted': {
      const contacted = p.contacted.includes(action.category)
        ? p.contacted.filter((c) => c !== action.category)
        : [...p.contacted, action.category];
      return {
        ...state,
        plan: { ...p, contacted },
      };
    }

    default:
      return undefined;
  }
};

/** Intake edits (re-allocation) and over-budget trade-offs. */
const intakeReducer: FeatureReducer = (state, p, action) => {
  switch (action.type) {
    case 'updateIntake': {
      const allocation = allocate(
        action.intake.totalBudget,
        action.intake.occasion,
        action.intake.priorities,
      );
      const perPlate =
        action.intake.guests > 0
          ? Math.round(allocation.catering / action.intake.guests)
          : DEFAULT_PER_PLATE;
      const updated: Plan = {
        ...p,
        occasion: action.intake.occasion,
        totalBudget: action.intake.totalBudget,
        guests: action.intake.guests,
        eventDate: action.intake.eventDate,
        city: action.intake.city,
        vibe: action.intake.vibe ?? p.vibe,
        priorities: action.intake.priorities,
        priorityKeys: action.intake.priorityKeys ?? p.priorityKeys,
        allocation,
        perPlate,
      };
      return {
        ...state,
        plan: updated,
        toast: { message: 'Celebration vision updated & budget recalculated!', type: 'success' },
      };
    }

    case 'applyTradeoff': {
      const updated = applyOption(p, action.optionId);
      return {
        ...state,
        plan: updated,
        toast: { message: 'Trade-off option applied successfully.', type: 'success' },
      };
    }

    default:
      return undefined;
  }
};

/**
 * Budget, guest-count, category locks, intake edits and trade-offs.
 *
 * @param state - Current state.
 * @param p - The current plan (non-null).
 * @param action - Dispatched action.
 * @returns New state, or `undefined` when the action belongs to another reducer.
 * @example
 * ```ts
 * coreReducer(state, plan, { type: 'setBudget', budget: 2_000_000 })?.plan?.totalBudget; // => 2000000
 * ```
 */
export const coreReducer: FeatureReducer = (state, p, action) =>
  budgetReducer(state, p, action) ?? intakeReducer(state, p, action);
