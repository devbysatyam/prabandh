import type { FC } from 'react';
import type { Category, StoredQuote, VendorMeeting } from '../../schemas';
import type { Action } from '../../state/planStore';
import type { vendorChecklist } from '../../engine/vendors';
import { statusBadgeClass } from './helpers';

type ChecklistItem = ReturnType<typeof vendorChecklist>[number];

interface ChecklistViewProps {
  items: ChecklistItem[];
  quotes: StoredQuote[];
  meetings: VendorMeeting[];
  bookedCount: number;
  dispatch: (action: Action) => void;
  onAddTasting: (category: Category, label: string) => void;
  onAddQuote: (category: Category) => void;
}

interface ChecklistRowProps {
  item: ChecklistItem;
  quoteCount: number;
  hasTasting: boolean;
  dispatch: (action: Action) => void;
  onAddTasting: (category: Category, label: string) => void;
  onAddQuote: (category: Category) => void;
}

const ChecklistRow: FC<ChecklistRowProps> = ({
  item,
  quoteCount,
  hasTasting,
  dispatch,
  onAddTasting,
  onAddQuote,
}) => (
  <div className="py-3 flex flex-wrap items-center justify-between gap-3">
    <div className="min-w-0 max-w-xl">
      <div className="flex items-center gap-2">
        <p className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
          {item.label}
        </p>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusBadgeClass(item.status)}`}
        >
          {item.status.replace('_', ' ')}
        </span>
        {quoteCount > 0 && (
          <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-400">
            ({quoteCount} quote{quoteCount > 1 ? 's' : ''})
          </span>
        )}
        {hasTasting && (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
            ✓ Tasting Done
          </span>
        )}
      </div>
      <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">{item.hint}</p>
    </div>

    <div className="flex items-center gap-3">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
        <input
          id={`contacted-checkbox-${item.category}`}
          aria-label={`Mark supplier for ${item.label} as contacted`}
          type="checkbox"
          checked={item.contacted}
          onChange={() => dispatch({ type: 'toggleContacted', category: item.category })}
          className="w-4 h-4 rounded text-brand-700 dark:text-brand-400 focus:ring-brand-500"
        />
        Contacted
      </label>

      <button
        type="button"
        onClick={() => onAddTasting(item.category, item.label)}
        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
      >
        + Tasting
      </button>

      <button
        type="button"
        onClick={() => onAddQuote(item.category)}
        className="text-xs font-semibold text-brand-700 hover:text-brand-700 dark:text-brand-400 hover:underline"
      >
        + Quote
      </button>
    </div>
  </div>
);

/** Sub-view 1: per-category sourcing checklist. */
export const ChecklistView: FC<ChecklistViewProps> = ({
  items,
  quotes,
  meetings,
  bookedCount,
  dispatch,
  onAddTasting,
  onAddQuote,
}) => (
  <section className="card space-y-3">
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
      <div>
        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
          Celebration Sourcing Checklist
        </h4>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Mark suppliers as contacted once you begin conversations. Accepting a quote automatically
          marks the category locked.
        </p>
      </div>
      <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
        {bookedCount} of {items.length} categories confirmed
      </span>
    </div>

    <div className="divide-y divide-stone-100 dark:divide-stone-800">
      {items.map((item) => (
        <ChecklistRow
          key={item.category}
          item={item}
          quoteCount={quotes.filter((q) => q.category === item.category).length}
          hasTasting={meetings.some((m) => m.category === item.category)}
          dispatch={dispatch}
          onAddTasting={onAddTasting}
          onAddQuote={onAddQuote}
        />
      ))}
    </div>
  </section>
);
