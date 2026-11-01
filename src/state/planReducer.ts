import { createDefaultPlan } from './planFactory';
import { clearSavedPlan } from './persistence';
import { createSamplePlan } from './samplePlan';
import { coreReducer } from './reducers/core';
import { guestsReducer } from './reducers/guests';
import { tasksReducer } from './reducers/tasks';
import { vendorsReducer } from './reducers/vendors';
import { venuesReducer } from './reducers/venues';
import type { Action, FeatureReducer, PlanState } from './types';

const FEATURE_REDUCERS: readonly FeatureReducer[] = [
  coreReducer,
  tasksReducer,
  guestsReducer,
  venuesReducer,
  vendorsReducer,
];

/** Actions that replace or clear the whole plan (valid even when no plan exists). */
function lifecycleReducer(state: PlanState, action: Action): PlanState | undefined {
  switch (action.type) {
    case 'reset':
      clearSavedPlan();
      return { plan: null, toast: { message: 'Plan has been reset.', type: 'info' } };
    case 'loadSamplePlan':
      return {
        plan: createSamplePlan(),
        toast: { message: 'Loaded curated celebration demo plan!', type: 'success' },
      };
    case 'loadPlan':
      return {
        plan: action.plan,
        toast: { message: 'Plan loaded successfully.', type: 'success' },
      };
    case 'create':
      return {
        plan: createDefaultPlan(action.intake),
        toast: { message: 'New plan created in प्रबंध (Prabandh)!', type: 'success' },
      };
    case 'dismissToast':
      return { ...state, toast: null };
    default:
      return undefined;
  }
}

/**
 * Pure state machine for the single source-of-truth plan. Lifecycle actions run first, then each
 * feature reducer (core, tasks, guests, venues, vendors) until one handles the action.
 *
 * @param state - Current state.
 * @param action - Dispatched action.
 * @returns The next state; the same object when the action does not apply.
 * @example
 * ```ts
 * planReducer({ plan, toast: null }, { type: 'setGuests', guests: 250 }).plan?.guests; // => 250
 * ```
 */
export function planReducer(state: PlanState, action: Action): PlanState {
  const lifecycle = lifecycleReducer(state, action);
  if (lifecycle) return lifecycle;

  const { plan } = state;
  if (!plan) return state;
  for (const reduce of FEATURE_REDUCERS) {
    const next = reduce(state, plan, action);
    if (next) return next;
  }
  return state;
}
