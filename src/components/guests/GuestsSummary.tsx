import { memo, type FC } from 'react';
import type { Plan } from '../../schemas';
import type { aggregateGuests } from '../../engine/guests';
import { Icon } from '../Icon';

type GuestSummary = ReturnType<typeof aggregateGuests>;

interface GuestsSummaryProps {
  summary: GuestSummary;
  targetGuests: Plan['guests'];
  onSync: () => void;
  onAdd: () => void;
}

interface MetricProps {
  label: string;
  value: number;
  caption: string;
  valueClass: string;
}

const Metric: FC<MetricProps> = ({ label, value, caption, valueClass }) => (
  <div>
    <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
      {label}
    </span>
    <p className={`text-2xl font-extrabold ${valueClass}`}>{value}</p>
    <p className="text-[11px] text-stone-600 dark:text-stone-400">{caption}</p>
  </div>
);

/** Header card: title, actions, headcount metrics and dietary breakdown. */
export const GuestsSummary: FC<GuestsSummaryProps> = memo(
  ({ summary, targetGuests, onSync, onAdd }) => (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
            <Icon name="users" className="w-5 h-5 text-brand-700 dark:text-brand-400" />
            Guest List & RSVP Manager
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Manage families, sides, and meal preferences. Directly feeds the master headcount into
            catering calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSync}
            className="btn-secondary text-xs"
            title="Recalculate plan guest count from current list"
          >
            Sync Headcount ({summary.totalInvitedCount} Guests)
          </button>
          <button type="button" onClick={onAdd} className="btn-primary text-xs">
            <Icon name="plus" className="w-4 h-4" />
            Add Guest / Family
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-stone-100 dark:border-stone-800">
        <Metric
          label="Total Headcount"
          value={summary.totalInvitedCount}
          caption={`${summary.totalEntries} families listed`}
          valueClass="text-stone-900 dark:text-stone-100"
        />
        <Metric
          label="Confirmed RSVPs"
          value={summary.confirmedCount}
          caption={`${summary.confirmationRate}% confirmed`}
          valueClass="text-emerald-700 dark:text-emerald-400"
        />
        <Metric
          label="Pending Responses"
          value={summary.pendingCount}
          caption="Need follow-up"
          valueClass="text-amber-700 dark:text-amber-400"
        />
        <Metric
          label="Declined"
          value={summary.declinedCount}
          caption="Seats freed"
          valueClass="text-stone-600 dark:text-stone-400"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-stone-600 dark:text-stone-400">Dietary Needs:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
            <span aria-hidden="true">🥬</span> Veg: {summary.byDiet.veg}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-medium">
            <span aria-hidden="true">🌿</span> Jain (No root): {summary.byDiet.jain}
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-medium">
            <span aria-hidden="true">🍗</span> Non-Veg: {summary.byDiet.non_veg}
          </span>
        </div>

        <div className="text-stone-600 dark:text-stone-400 text-[11px]">
          Target in Master Plan:{' '}
          <strong className="text-stone-700 dark:text-stone-200">{targetGuests} guests</strong>
        </div>
      </div>
    </section>
  ),
);
GuestsSummary.displayName = 'GuestsSummary';
