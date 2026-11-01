import { memo, type FC, type ReactNode } from 'react';
import type { Plan } from '../../schemas';
import { formatINR, toLakh } from '../../engine';
import type { BudgetStatus } from '../../engine/budget';
import type { GuestSummary } from '../../engine/guests';
import { Icon } from '../Icon';

interface MetricCardProps {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  children: ReactNode;
}

const MetricCard: FC<MetricCardProps> = ({ label, icon, value, children }) => (
  <div className="card">
    <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 mb-1">
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      {icon}
    </div>
    <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
      {value}
    </p>
    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{children}</p>
  </div>
);

interface MetricsGridProps {
  plan: Plan;
  status: BudgetStatus;
  guests: GuestSummary;
  daysLeft: number;
}

/** Top row of headline numbers: budget, committed spend, headcount and days left. */
export const MetricsGrid: FC<MetricsGridProps> = memo(({ plan, status, guests, daysLeft }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard
      label="Total Budget"
      icon={<Icon name="wallet" className="w-4 h-4 text-brand-700 dark:text-brand-400" />}
      value={formatINR(status.total)}
    >
      {toLakh(status.total)} · {formatINR(plan.perPlate)}/plate
    </MetricCard>
    <MetricCard
      label="Committed Contracts"
      icon={<span className="w-2 h-2 rounded-full bg-emerald-500" />}
      value={formatINR(status.committed)}
    >
      {status.isOverBudget ? (
        <span className="text-red-600 dark:text-red-400 font-semibold">
          Over by {formatINR(status.overBy)}
        </span>
      ) : (
        `${formatINR(status.total - status.committed)} buffer left`
      )}
    </MetricCard>
    <MetricCard
      label="Target Guests"
      icon={<Icon name="users" className="w-4 h-4 text-gold-700 dark:text-gold-300" />}
      value={plan.guests}
    >
      {guests.totalEntries > 0
        ? `${guests.confirmedCount} confirmed (${guests.confirmationRate}%)`
        : 'Add guests in Guests tab'}
    </MetricCard>
    <MetricCard
      label="Timeline"
      icon={<Icon name="clock" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
      value={daysLeft > 0 ? `${daysLeft} Days` : 'Today!'}
    >
      Date: {plan.eventDate}
    </MetricCard>
  </div>
));
MetricsGrid.displayName = 'MetricsGrid';
