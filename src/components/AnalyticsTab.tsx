import { useMemo, type FC } from 'react';
import type { Plan } from '../schemas';
import type { TabId } from './Navigation';
import { Icon } from './Icon';
import { computeCelebrationAnalytics } from '../engine/analytics';
import { formatINR } from '../engine/money';
import { AnalyticsHero } from './analytics/AnalyticsHero';

interface AnalyticsTabProps {
  plan: Plan;
  today: string;
  onNavigate: (tab: TabId) => void;
}

/** Event intelligence: readiness, unit economics and prioritised recommendations. */
export const AnalyticsTab: FC<AnalyticsTabProps> = ({ plan, today, onNavigate }) => {
  const analytics = useMemo(() => computeCelebrationAnalytics(plan, today), [plan, today]);
  const { guestSummary: gSummary } = analytics;

  return (
    <div className="space-y-6">
      <AnalyticsHero plan={plan} analytics={analytics} />

      {/* Priority Recommendations derived from Analytics */}
      <section className="card">
        <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base mb-2 flex items-center gap-2">
          <Icon name="sparkle" className="w-5 h-5 text-brand-700 dark:text-brand-400" />
          Analytics-Driven Priority Actions
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
          Automated recommendations generated deterministically by evaluating budget gaps, RSVP
          velocity, and vendor trial logs.
        </p>

        <div className="space-y-2.5">
          {analytics.keyActionRecommendations.map((rec, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 flex items-start gap-3"
            >
              <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                {rec}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Category Benchmark Variance Table */}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Category Allocation vs {plan.occasion.replace('_', ' ')} Benchmark
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Evaluates whether your allocation matches cultural best-practice proportions or skews
              heavy/lean.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('budget')}
            className="btn-secondary text-xs"
          >
            Adjust in Connected Budget →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              Budget allocation by category compared with standard benchmarks
            </caption>
            <thead className="bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 uppercase tracking-wider font-bold">
              <tr>
                <th scope="col" className="py-2.5 px-3 rounded-l-lg">
                  Category
                </th>
                <th scope="col" className="py-2.5 px-3">
                  Allocated Amount
                </th>
                <th scope="col" className="py-2.5 px-3">
                  Actual Share
                </th>
                <th scope="col" className="py-2.5 px-3">
                  Standard Benchmark
                </th>
                <th scope="col" className="py-2.5 px-3">
                  Variance
                </th>
                <th scope="col" className="py-2.5 px-3 rounded-r-lg">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {analytics.categories.map((c) => (
                <tr key={c.category} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/40">
                  <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100 capitalize">
                    {c.category}
                  </td>
                  <td className="py-3 px-3 font-semibold text-stone-700 dark:text-stone-300">
                    {formatINR(c.allocatedRupees)}
                  </td>
                  <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100">
                    {c.allocatedPct}%
                  </td>
                  <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                    {c.benchmarkPct}%
                  </td>
                  <td className="py-3 px-3 font-semibold">
                    {c.variancePct > 0 ? (
                      <span className="text-brand-700 dark:text-brand-400">+{c.variancePct}%</span>
                    ) : c.variancePct < 0 ? (
                      <span className="text-indigo-600">{c.variancePct}%</span>
                    ) : (
                      <span className="text-stone-600 dark:text-stone-400">0%</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'heavy'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : c.status === 'lean'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Guest Dietary Split & Site Inspection Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dietary Split */}
        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Dietary Preference Split
            </h4>
            <span className="text-xs text-stone-600 dark:text-stone-400">
              {gSummary.totalInvitedCount} Total Guests
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Pure Vegetarian', count: gSummary.byDiet.veg, color: 'bg-emerald-500' },
              {
                label: 'Jain (No Root Veggies)',
                count: gSummary.byDiet.jain,
                color: 'bg-gold-500',
              },
              { label: 'Non-Vegetarian', count: gSummary.byDiet.non_veg, color: 'bg-rose-500' },
              { label: 'Unspecified / Any', count: gSummary.byDiet.any, color: 'bg-stone-400' },
            ].map((d) => {
              const pct =
                gSummary.totalInvitedCount > 0
                  ? Math.round((d.count / gSummary.totalInvitedCount) * 100)
                  : 0;
              return (
                <div key={d.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {d.label}
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {d.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${d.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recce & Tasting Quality */}
        <section className="card">
          <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-3">
            Recce & Tasting Verification Index
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-stone-900 dark:text-stone-100">
                  Venue Site Visits
                </p>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  AC, green rooms, sound curfew & parking
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {analytics.siteVisitsCompleted}
                </span>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                  {analytics.siteVisitsAvgRating > 0
                    ? `★ ${analytics.siteVisitsAvgRating}/5.0`
                    : 'Not rated yet'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-stone-900 dark:text-stone-100">
                  Vendor Tastings & Trials
                </p>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  Food tastings, makeup trials & sound checks
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {analytics.vendorTastingsCompleted}
                </span>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                  {analytics.vendorTastingsAvgRating > 0
                    ? `★ ${analytics.vendorTastingsAvgRating}/5.0`
                    : 'Not rated yet'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
