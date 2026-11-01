import { useMemo, type FC } from 'react';
import type { Plan } from '../schemas';
import type { TabId } from './Navigation';
import { Icon } from './Icon';
import { computeCelebrationAnalytics } from '../engine/analytics';
import { formatINR, toLakh } from '../engine/money';

interface AnalyticsTabProps {
  plan: Plan;
  today: string;
  onNavigate: (tab: TabId) => void;
}

export const AnalyticsTab: FC<AnalyticsTabProps> = ({ plan, today, onNavigate }) => {
  const analytics = useMemo(() => computeCelebrationAnalytics(plan, today), [plan, today]);
  const { readiness, budgetStatus: bStatus, guestSummary: gSummary } = analytics;

  const tierColors = {
    excellent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
    on_track: 'text-brand-600 bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800',
    needs_attention: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
    critical: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800',
  };

  const tierLabels = {
    excellent: 'Excellent Readiness (उत्कृष्ट तैयारी)',
    on_track: 'On Track (योजना अनुसार)',
    needs_attention: 'Needs Attention (ध्यान देने योग्य)',
    critical: 'Action Required (तुरंत कार्रवाई)',
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <section className="card bg-gradient-to-br from-stone-900 to-stone-800 text-white dark:from-stone-900 dark:to-stone-950 p-6 border-none shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-2">
              <Icon name="sparkle" className="w-3.5 h-3.5" />
              Event Intelligence & Diagnostics (समारोह विश्लेषण)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {plan.title} — Analytics & Health
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Real-time celebration analytics combining financial burn rate, per-guest unit economics,
              RSVP conversion, recce ratings, and timeline execution health.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-stone-800/80 p-4 rounded-2xl border border-stone-700/60">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
                Overall Readiness
              </span>
              <span className="text-3xl font-extrabold text-white">
                {readiness.totalScore}
                <span className="text-lg text-stone-400 font-normal">/100</span>
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${tierColors[readiness.tier]}`}>
              {tierLabels[readiness.tier]}
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillar Scores Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Financial Pillar */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              1. Financial Health
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {readiness.budgetScore}/25
            </span>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {formatINR(analytics.perGuestCost)}
            <span className="text-xs text-stone-400 font-normal ml-1">/ guest</span>
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Total {toLakh(bStatus.total)} for {plan.guests} target guests
          </p>
          <div className="mt-3 w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${bStatus.isOverBudget ? 'bg-red-500' : 'bg-brand-500'}`}
              style={{ width: `${(readiness.budgetScore / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Timeline Pillar */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              2. Timeline Pace
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {readiness.timelineScore}/25
            </span>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {analytics.daysRemaining} Days Left
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {analytics.overdueTasksCount > 0 ? (
              <span className="text-red-500 font-bold">{analytics.overdueTasksCount} tasks overdue</span>
            ) : (
              <span className="text-emerald-500 font-semibold">Milestones on schedule</span>
            )}
          </p>
          <div className="mt-3 w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${(readiness.timelineScore / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Vendor & Recce Pillar */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              3. Vendor & Recce
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {readiness.vendorScore}/25
            </span>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {plan.vendors.filter((v) => v.status === 'booked').length} Booked
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {analytics.siteVisitsCompleted} site visits · {analytics.vendorTastingsCompleted} tastings
          </p>
          <div className="mt-3 w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${(readiness.vendorScore / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Guest RSVP Pillar */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              4. RSVP Conversion
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {readiness.guestScore}/25
            </span>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {gSummary.confirmationRate}%
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {gSummary.confirmedCount} confirmed of {gSummary.totalInvitedCount} invited
          </p>
          <div className="mt-3 w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(readiness.guestScore / 25) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Priority Recommendations derived from Analytics */}
      <section className="card">
        <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base mb-2 flex items-center gap-2">
          <Icon name="sparkle" className="w-5 h-5 text-brand-600" />
          Analytics-Driven Priority Actions
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          Automated recommendations generated deterministically by evaluating budget gaps, RSVP velocity, and vendor trial logs.
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
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Evaluates whether your allocation matches cultural best-practice proportions or skews heavy/lean.
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
            <thead className="bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Category</th>
                <th className="py-2.5 px-3">Allocated Amount</th>
                <th className="py-2.5 px-3">Actual Share</th>
                <th className="py-2.5 px-3">Standard Benchmark</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3 rounded-r-lg">Status</th>
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
                  <td className="py-3 px-3 text-stone-500">
                    {c.benchmarkPct}%
                  </td>
                  <td className="py-3 px-3 font-semibold">
                    {c.variancePct > 0 ? (
                      <span className="text-brand-600">+{c.variancePct}%</span>
                    ) : c.variancePct < 0 ? (
                      <span className="text-indigo-600">{c.variancePct}%</span>
                    ) : (
                      <span className="text-stone-400">0%</span>
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
            <span className="text-xs text-stone-500">{gSummary.totalInvitedCount} Total Guests</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Pure Vegetarian', count: gSummary.byDiet.veg, color: 'bg-emerald-500' },
              { label: 'Jain (No Root Veggies)', count: gSummary.byDiet.jain, color: 'bg-gold-500' },
              { label: 'Non-Vegetarian', count: gSummary.byDiet.non_veg, color: 'bg-rose-500' },
              { label: 'Unspecified / Any', count: gSummary.byDiet.any, color: 'bg-stone-400' },
            ].map((d) => {
              const pct = gSummary.totalInvitedCount > 0 ? Math.round((d.count / gSummary.totalInvitedCount) * 100) : 0;
              return (
                <div key={d.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-stone-700 dark:text-stone-300">{d.label}</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{d.count} ({pct}%)</span>
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
                <p className="font-bold text-xs text-stone-900 dark:text-stone-100">Venue Site Visits</p>
                <p className="text-[11px] text-stone-500">AC, green rooms, sound curfew & parking</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {analytics.siteVisitsCompleted}
                </span>
                <p className="text-[10px] text-amber-500 font-bold">
                  {analytics.siteVisitsAvgRating > 0 ? `★ ${analytics.siteVisitsAvgRating}/5.0` : 'Not rated yet'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-stone-900 dark:text-stone-100">Vendor Tastings & Trials</p>
                <p className="text-[11px] text-stone-500">Food tastings, makeup trials & sound checks</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {analytics.vendorTastingsCompleted}
                </span>
                <p className="text-[10px] text-amber-500 font-bold">
                  {analytics.vendorTastingsAvgRating > 0 ? `★ ${analytics.vendorTastingsAvgRating}/5.0` : 'Not rated yet'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
