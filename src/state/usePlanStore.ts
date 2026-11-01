import { useCallback, useEffect, useReducer, type Dispatch } from 'react';
import { getInitialPlan, savePlan } from './persistence';
import { planReducer } from './planReducer';
import type { Action, PlanState } from './types';

/**
 * Plan state hook: reducer, autosave to localStorage and toast dismissal.
 *
 * @returns `state`, `dispatch` and `clearToast`.
 * @example
 * ```ts
 * const { state, dispatch } = usePlanStore();
 * dispatch({ type: 'loadSamplePlan' });
 * ```
 */
export function usePlanStore(): {
  state: PlanState;
  dispatch: Dispatch<Action>;
  clearToast: () => void;
} {
  const [state, dispatch] = useReducer(planReducer, null, () => ({
    plan: getInitialPlan(),
    toast: null,
  }));

  useEffect(() => {
    if (state.plan) savePlan(state.plan);
  }, [state.plan]);

  const clearToast = useCallback(() => dispatch({ type: 'dismissToast' }), []);

  return { state, dispatch, clearToast };
}
