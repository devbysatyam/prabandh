import { memo } from 'react';
import type { Toast } from '../state/planStore';

interface ToastRegionProps {
  toast: Toast | null;
  onDismiss: () => void;
}

/** Always-mounted polite live region so announcements are reliable; shows the current toast. */
export const ToastRegion = memo(function ToastRegion({ toast, onDismiss }: ToastRegionProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="no-print fixed bottom-6 right-6 z-50"
    >
      {toast && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs sm:text-sm font-semibold shadow-xl border border-stone-800 dark:border-stone-200">
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="inline-flex items-center justify-center min-w-[24px] min-h-[24px] text-stone-300 dark:text-stone-600 hover:text-white dark:hover:text-stone-900 ml-2"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}
    </div>
  );
});
