import { useMemo, type FC } from 'react';
import type { Category, Plan } from '../schemas';
import { CATEGORIES } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { budgetStatus, generateOverBudgetOptions, scaleGuests, formatINR, toLakh } from '../engine';
import { OCCASION_LABELS } from '../engine/presets';

interface BudgetTabProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

const CATEGORY_COLORS: Record<Category, string> = {
  venue: 'bg-amber-500',
  catering: 'bg-brand-500',
  decor: 'bg-rose-500',
  photography: 'bg-indigo-500',
  entertainment: 'bg-purple-500',
  misc: 'bg-emerald-500',
  contingency: 'bg-stone-400',
};

export const BudgetTab: FC<BudgetTabProps> = ({ plan, dispatch }) => {
  const status = useMemo(() => budgetStatus(plan), [plan]);
  const options = useMemo(() => generateOverBudgetOptions(plan), [plan]);
  const cateringScaling = useMemo(() => scaleGuests(plan, plan.guests), [plan]);

  const labels = OCCASION_LABELS[plan.occasion];

  function handleCategoryChange(cat: Category, value: number) {
    dispatch({ type: 'setAmount', category: cat, amount: value });
  }

  function handleToggleLock(cat: Category) {
    dispatch({ type: 'toggleLock', category: cat });
  }

  function handleApplyOption(optionId: 'reduce_guests' | 'trim_categories' | 'use_contingency') {
    dispatch({ type: 'applyTradeoff', optionId });
  }

  return (
    <div className="space-y-6">
      {/* Top summary card */}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Connected Budget Architecture
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              100% deterministic integer rupee math with zero rounding drift. Drag any slider to
              redistribute.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="edit-total-budget" className="text-xs text-stone-500">
              Edit total:
            </label>
            <input
              id="edit-total-budget"
              aria-label="Total celebration budget in rupees"
              type="number"
              value={plan.totalBudget}
              step={10000}
              min={10000}
              onChange={(e) =>
                dispatch({ type: 'setBudget', budget: parseInt(e.target.value || '10000', 10) })
              }
              className="w-36 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-1 text-xs font-bold text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* 4-col summary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Total Allocation
            </span>
            <p className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {formatINR(status.total)}
            </p>
            <p className="text-[11px] text-stone-500">{toLakh(status.total)}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Committed Contracts
            </span>
            <p className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {formatINR(status.committed)}
            </p>
            <p className="text-[11px] text-stone-500">
              {plan.vendors.filter((v) => v.status === 'booked').length} booked
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Estimated Pool
            </span>
            <p className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {formatINR(status.estimated)}
            </p>
            <p className="text-[11px] text-stone-500">Unbooked categories</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Contingency Buffer
            </span>
            <p className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {formatINR(status.contingencyLeft)}
            </p>
            <p className="text-[11px] text-stone-500">Fixed 10% safety pool</p>
          </div>
        </div>

        {/* Multi-segment allocation bar */}
        <div className="mt-4">
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800">
            {CATEGORIES.map((cat) => {
              const amount = plan.allocation[cat];
              const pct = status.total > 0 ? (amount / status.total) * 100 : 0;
              return (
                <div
                  key={cat}
                  style={{ width: `${pct}%` }}
                  className={`${CATEGORY_COLORS[cat]} transition-all duration-300 relative group`}
                  title={`${cat}: ${formatINR(amount)} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm ${CATEGORY_COLORS[cat]}`} />
                <span className="capitalize">{cat}</span>
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {status.total > 0 ? Math.round((plan.allocation[cat] / status.total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Over-budget Warning & Trade-off Solutions Banner */}
      {status.isOverBudget && (
        <section className="card border-red-300 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="alert" className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-900 dark:text-red-200 text-base">
                Over Budget by {formatINR(status.overBy)}
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                Your guest headcount of {plan.guests} demands{' '}
                {formatINR(cateringScaling.requiredCatering)} for catering at{' '}
                {formatINR(plan.perPlate)}/plate, but catering is currently budgeted at{' '}
                {formatINR(plan.allocation.catering)}.
              </p>

              {/* 3 Automated Trade-off Solutions */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className="rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-stone-900 p-3.5 flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        Automated Option
                      </span>
                      <p className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-1">
                        {opt.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyOption(opt.id)}
                      className="mt-3 btn-secondary text-xs w-full hover:border-red-500 hover:text-red-600 font-bold"
                    >
                      Apply Solution →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category Rows */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider">
            Category Allocations & Sliders
          </h4>
          <span className="text-xs text-stone-500">
            {plan.locked.length} of {CATEGORIES.length} categories locked
          </span>
        </div>

        <div className="space-y-3.5">
          {CATEGORIES.map((cat) => {
            const amount = plan.allocation[cat];
            const isLocked = plan.locked.includes(cat);
            const isPriority = plan.priorities.includes(cat);
            const percentage = status.total > 0 ? (amount / status.total) * 100 : 0;
            const customLabel = labels[cat];

            return (
              <div
                key={cat}
                className={`p-3.5 rounded-xl border transition ${
                  isLocked
                    ? 'border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/60'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-brand-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat]}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900 dark:text-stone-100 capitalize">
                          {cat}
                        </span>
                        {isPriority && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                            ★ Priority (+25%)
                          </span>
                        )}
                        {cat === 'contingency' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                            Safety Buffer
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{customLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-extrabold text-sm text-stone-900 dark:text-stone-100 font-sans">
                        {formatINR(amount)}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {percentage.toFixed(1)}% · {toLakh(amount)}
                      </p>
                    </div>

                    {/* Lock toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLock(cat)}
                      aria-label={
                        isLocked ? `Unlock ${cat} category` : `Lock ${cat} category amount`
                      }
                      className={`p-2 rounded-lg border transition ${
                        isLocked
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                          : 'border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-600'
                      }`}
                      title={isLocked ? 'Unlock category' : 'Lock category amount'}
                    >
                      <Icon name={isLocked ? 'lock' : 'unlock'} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    aria-label={`${cat} allocation slider`}
                    min={0}
                    max={status.total}
                    step={1000}
                    disabled={isLocked}
                    value={amount}
                    onChange={(e) => handleCategoryChange(cat, parseInt(e.target.value, 10))}
                    className="w-full h-2 rounded-lg accent-brand-600 bg-stone-100 dark:bg-stone-800 cursor-pointer disabled:opacity-40"
                  />
                  <input
                    type="number"
                    aria-label={`${cat} allocation amount in rupees`}
                    min={0}
                    max={status.total}
                    step={1000}
                    disabled={isLocked}
                    value={amount}
                    onChange={(e) => handleCategoryChange(cat, parseInt(e.target.value || '0', 10))}
                    className="w-28 rounded-lg border border-stone-200 dark:border-stone-800 px-2 py-1 text-xs font-semibold text-right disabled:opacity-40"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
