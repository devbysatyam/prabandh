import type { RunSheetItem, TaskStatus } from '../../schemas';
import type { FeatureReducer } from '../types';

/**
 * Timeline tasks and the day-of run sheet.
 *
 * @param state - Current state.
 * @param p - The current plan (non-null).
 * @param action - Dispatched action.
 * @returns New state, or `undefined` when not handled.
 * @example
 * ```ts
 * tasksReducer(state, plan, { type: 'setTaskStatus', taskId: 't-1', status: 'done' });
 * ```
 */
export const tasksReducer: FeatureReducer = (state, p, action) => {
  switch (action.type) {
    case 'setTaskStatus': {
      const tasks = p.tasks.map((t) =>
        t.id === action.taskId ? { ...t, status: action.status } : t,
      );
      return { ...state, plan: { ...p, tasks } };
    }

    case 'setTaskDelay': {
      const delayedStatus: TaskStatus = action.delayDays > 0 ? 'delayed' : 'todo';
      const tasks = p.tasks.map((t) =>
        t.id === action.taskId
          ? {
              ...t,
              delayDays: action.delayDays,
              status: delayedStatus,
            }
          : t,
      );
      return {
        ...state,
        plan: { ...p, tasks },
        toast: {
          message: `Applied ${action.delayDays} day delay. Downstream dates updated.`,
          type: 'warn',
        },
      };
    }

    case 'cycleRunSheet': {
      const runSheet = p.runSheet.map((item) => {
        if (item.id !== action.itemId) return item;
        let nextStatus: RunSheetItem['status'] = 'in_progress';
        if (item.status === 'in_progress') nextStatus = 'completed';
        else if (item.status === 'completed') nextStatus = 'pending';
        return { ...item, status: nextStatus };
      });
      return { ...state, plan: { ...p, runSheet } };
    }

    case 'addRunSheetItem': {
      const runSheet = [...p.runSheet, action.item];
      return { ...state, plan: { ...p, runSheet } };
    }

    default:
      return undefined;
  }
};
