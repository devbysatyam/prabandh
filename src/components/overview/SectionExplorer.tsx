import { memo, type FC } from 'react';
import type { Plan } from '../../schemas';
import { formatINR } from '../../engine';
import type { BudgetStatus } from '../../engine/budget';
import type { GuestSummary } from '../../engine/guests';
import type { TabId } from '../Navigation';
import { SECTION_SHORTCUTS, type SectionShortcut } from './constants';

interface SectionExplorerProps {
  plan: Plan;
  status: BudgetStatus;
  guests: GuestSummary;
  onNavigate: (tab: TabId) => void;
}

type SectionDescriber = (plan: Plan, status: BudgetStatus, guests: GuestSummary) => string;

const SECTION_DESCRIBERS: Partial<Record<TabId, SectionDescriber>> = {
  venues: (plan) =>
    `${(plan.venues ?? []).length} properties · ${(plan.siteVisits ?? []).length} site recce logged`,
  vendors: (plan) =>
    `${plan.vendors.length} vendors · ${(plan.vendorMeetings ?? []).length} tastings & trials logged`,
  budget: (_plan, status) => `${formatINR(status.total)} · Sliders & Trade-offs`,
  guests: (_plan, _status, guests) =>
    `${guests.totalEntries} families (${guests.totalInvitedCount} seats) · WhatsApp`,
  timeline: (plan) => `${plan.tasks.length} tasks with dependency chains`,
  runsheet: (plan) => `${plan.runSheet.length} itinerary blocks with POCs`,
  ideas: () => '6 curated themes & cost-saving ideas',
  analytics: () => 'Unit economics, 4-pillar scores & benchmarks',
};

/** Subtitle line for a shortcut card, derived from live plan data. */
function describeSection(
  tab: TabId,
  plan: Plan,
  status: BudgetStatus,
  guests: GuestSummary,
): string {
  const describe = SECTION_DESCRIBERS[tab];
  return describe ? describe(plan, status, guests) : 'Edit city, budget & +25% priority weights';
}

const CARD_CLASS =
  'p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-500 hover:bg-stone-50 dark:hover:bg-stone-900/60 text-left transition group';
const FEATURED_CARD_CLASS =
  'p-3.5 rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/20 dark:bg-brand-950/20 hover:border-brand-500 hover:bg-brand-50/50 text-left transition group';

interface ShortcutCardProps {
  shortcut: SectionShortcut;
  subtitle: string;
  onNavigate: (tab: TabId) => void;
}

const ShortcutCard: FC<ShortcutCardProps> = ({ shortcut, subtitle, onNavigate }) => {
  const { featured } = shortcut;
  return (
    <button
      type="button"
      onClick={() => onNavigate(shortcut.tab)}
      className={featured ? FEATURED_CARD_CLASS : CARD_CLASS}
    >
      <div
        className={`flex items-center justify-between text-xs font-bold mb-1 ${
          featured ? 'text-brand-900 dark:text-brand-200' : 'text-stone-900 dark:text-stone-100'
        }`}
      >
        <span>
          <span aria-hidden="true">{shortcut.emoji}</span> {shortcut.title}
        </span>
        <span
          className={`transition group-hover:text-brand-600 ${
            featured
              ? 'text-brand-700 dark:text-brand-400 group-hover:text-brand-700'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          →
        </span>
      </div>
      <p className="text-[11px] text-stone-600 dark:text-stone-400">{subtitle}</p>
    </button>
  );
};

/** "Direct Section Explorer": one-click shortcuts into every tab. */
export const SectionExplorer: FC<SectionExplorerProps> = memo(
  ({ plan, status, guests, onNavigate }) => (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
            <span>
              <span aria-hidden="true">⚡</span>
            </span>{' '}
            Direct Section Explorer (<span lang="hi">सीधा अनुभाग दौरा</span>)
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Jump directly into any section to inspect, compare quotes, review logged visits, or edit
            celebration details.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SECTION_SHORTCUTS.map((shortcut) => (
          <ShortcutCard
            key={shortcut.tab}
            shortcut={shortcut}
            subtitle={describeSection(shortcut.tab, plan, status, guests)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  ),
);
SectionExplorer.displayName = 'SectionExplorer';
