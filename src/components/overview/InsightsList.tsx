import { memo, type FC } from 'react';
import type { Insight } from '../../engine/advisor';
import type { TabId } from '../Navigation';
import { Icon } from '../Icon';
import { SEVERITY_BADGE_CLASS, SEVERITY_DOT_CLASS } from './constants';

interface InsightsListProps {
  insights: readonly Insight[];
  onNavigate: (tab: TabId) => void;
}

const InsightRow: FC<{ insight: Insight; onNavigate: (tab: TabId) => void }> = ({
  insight,
  onNavigate,
}) => (
  <div className="py-3.5 flex flex-wrap items-start justify-between gap-3">
    <div className="flex items-start gap-3 max-w-2xl">
      <div className="mt-0.5 shrink-0">
        <span
          className={`w-2.5 h-2.5 rounded-full block ring-4 ${SEVERITY_DOT_CLASS[insight.severity]}`}
        />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${SEVERITY_BADGE_CLASS[insight.severity]}`}
          >
            {insight.severity}
          </span>
          <p className="font-bold text-sm text-stone-900 dark:text-stone-100">{insight.title}</p>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
          {insight.detail}
        </p>
      </div>
    </div>

    <button
      type="button"
      onClick={() => onNavigate(insight.tab)}
      className="btn-quiet text-brand-700 dark:text-brand-400 font-semibold shrink-0"
    >
      Open {insight.tab.charAt(0).toUpperCase() + insight.tab.slice(1)} →
    </button>
  </div>
);

/** Ranked "What Needs Your Attention" list (or the all-clear state). */
export const InsightsList: FC<InsightsListProps> = memo(({ insights, onNavigate }) => (
  <section className="card">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
          <Icon name="alert" className="w-4 h-4 text-brand-700 dark:text-brand-400" />
          What Needs Your Attention
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Ranked deterministically across budget, timeline dependencies, and vendor bookings.
        </p>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
        {insights.length} Insight{insights.length === 1 ? '' : 's'}
      </span>
    </div>

    {insights.length === 0 ? (
      <div className="text-center py-8 text-stone-600 dark:text-stone-400">
        <Icon
          name="check"
          className="w-8 h-8 text-emerald-700 dark:text-emerald-400 mx-auto mb-2"
        />
        <p className="font-semibold text-sm">All Systems Running Smoothly!</p>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
          No budget deficits or overdue timeline tasks detected.
        </p>
      </div>
    ) : (
      <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
        {insights.map((insight) => (
          <InsightRow key={insight.id} insight={insight} onNavigate={onNavigate} />
        ))}
      </div>
    )}
  </section>
));
InsightsList.displayName = 'InsightsList';
