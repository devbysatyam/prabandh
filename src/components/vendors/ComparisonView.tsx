import { useMemo, type FC } from 'react';
import type { Category, Plan, Quote, StoredQuote } from '../../schemas';
import type { Action } from '../../state/planStore';
import { compareQuoteToBudget } from '../../engine/vendors';
import { formatINR } from '../../engine/money';
import { Icon } from '../Icon';
import { CategorySelect } from './CategorySelect';
import { ComparisonTable } from './ComparisonTable';
import { categoryLabel } from './helpers';

interface ComparisonViewProps {
  plan: Plan;
  quotes: StoredQuote[];
  category: Category;
  onCategoryChange: (category: Category) => void;
  dispatch: (action: Action) => void;
  onAnalyze: (category: Category) => void;
  onLockIn: (quote: Quote) => void;
}

/** Sub-view 2: quote comparison matrix for one category. */
export const ComparisonView: FC<ComparisonViewProps> = ({
  plan,
  quotes,
  category,
  onCategoryChange,
  dispatch,
  onAnalyze,
  onLockIn,
}) => {
  const categoryBudget = plan.allocation[category] ?? 0;
  const evaluated = useMemo(
    () =>
      quotes
        .filter((q) => q.category === category)
        .map((sq) => ({ sq, comp: compareQuoteToBudget(sq.quote, categoryBudget, plan.guests) })),
    [quotes, category, categoryBudget, plan.guests],
  );

  return (
    <section className="space-y-4">
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Side-by-Side Quotation Comparison Matrix
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Compare multi-vendor proposals side-by-side on effective cost, minimum guarantees,
              advance payment risks, and hidden taxes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="comparison-category-select"
              className="text-xs font-semibold text-stone-600 dark:text-stone-400"
            >
              Category:
            </label>
            <CategorySelect
              id="comparison-category-select"
              ariaLabel="Quotation Comparison Category"
              value={category}
              occasion={plan.occasion}
              onChange={onCategoryChange}
              className="input-base text-xs py-1"
            />
          </div>
        </div>
      </div>

      {evaluated.length === 0 ? (
        <div className="card text-center py-10 space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 mx-auto flex items-center justify-center">
            <Icon name="sparkle" className="w-6 h-6" />
          </div>
          <div>
            <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
              No Quotations Saved Yet for {categoryLabel(plan.occasion, category)}
            </h5>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto mt-1">
              Paste WhatsApp proposals from your caterers, photographers, or decorators into the
              Quote Analyzer to compare them here side-by-side.
            </p>
          </div>
          <button type="button" onClick={() => onAnalyze(category)} className="btn-primary text-xs">
            + Analyze Proposal for {category}
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Comparing {evaluated.length} Proposal{evaluated.length > 1 ? 's' : ''} (Budget:{' '}
              {formatINR(categoryBudget)})
            </h5>
            <button
              type="button"
              onClick={() => onAnalyze(category)}
              className="btn-secondary text-xs"
            >
              + Add Another Quote
            </button>
          </div>
          <ComparisonTable
            evaluated={evaluated}
            guests={plan.guests}
            dispatch={dispatch}
            onLockIn={onLockIn}
          />
        </div>
      )}
    </section>
  );
};
