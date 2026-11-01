import { memo } from 'react';
import type { Plan } from '../../schemas';
import type { CelebrationAnalytics } from '../../engine/analytics';
import { formatINR, toLakh } from '../../engine/money';
import { Icon } from '../Icon';
import { LangText } from '../LangText';
import { TIER_COLORS, TIER_LABELS } from './constants';

interface AnalyticsHeroProps {
  plan: Plan;
  analytics: CelebrationAnalytics;
}

/** Dark hero card (overall readiness) plus the four pillar score cards. */
export const AnalyticsHero = memo(function AnalyticsHero({ plan, analytics }: AnalyticsHeroProps) {
  const { readiness, budgetStatus: bStatus, guestSummary: gSummary } = analytics;
  return (
    <>
      <section className="card bg-gradient-to-br from-stone-900 to-stone-800 text-white dark:from-stone-900 dark:to-stone-950 p-6 border-none shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-2">
              <Icon name="sparkle" className="w-3.5 h-3.5" />
              Event Intelligence & Diagnostics (<span lang="hi">समारोह विश्लेषण</span>)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {plan.title} — Analytics & Health
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Real-time celebration analytics combining financial burn rate, per-guest unit
              economics, RSVP conversion, recce ratings, and timeline execution health.
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
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${TIER_COLORS[readiness.tier]}`}
            >
              <LangText text={TIER_LABELS[readiness.tier]} />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillar Scores Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Financial Pillar */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              1. Financial Health
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {readiness.budgetScore}/25
            </span>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {formatINR(analytics.perGuestCost)}
            <span className="text-xs text-stone-600 dark:text-stone-400 font-normal ml-1">
              / guest
            </span>
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              2. Timeline Pace
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {readiness.timelineScore}/25
            </span>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {analytics.daysRemaining} Days Left
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {analytics.overdueTasksCount > 0 ? (
              <span className="text-red-600 dark:text-red-400 font-bold">
                {analytics.overdueTasksCount} tasks overdue
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Milestones on schedule
              </span>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              3. Vendor & Recce
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {readiness.vendorScore}/25
            </span>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {plan.vendors.filter((v) => v.status === 'booked').length} Booked
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {analytics.siteVisitsCompleted} site visits · {analytics.vendorTastingsCompleted}{' '}
            tastings
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
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              4. RSVP Conversion
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {readiness.guestScore}/25
            </span>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {gSummary.confirmationRate}%
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
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
    </>
  );
});
