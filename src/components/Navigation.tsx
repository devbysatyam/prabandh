import type { FC, KeyboardEvent } from 'react';
import { Icon, type IconName } from './Icon';
import { LangText } from './LangText';

export type TabId =
  | 'setup'
  | 'overview'
  | 'budget'
  | 'venues'
  | 'guests'
  | 'timeline'
  | 'vendors'
  | 'runsheet'
  | 'ideas'
  | 'analytics';

interface NavigationProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  badges?:
    | {
        overview?: number;
        budgetWarning?: boolean;
        venueCount?: number;
        guestCount?: number;
        timelineOverdue?: number;
        vendorPending?: number;
      }
    | undefined;
}

export const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'setup', label: 'Vision & Setup', icon: 'pencil' },
  { id: 'overview', label: 'Overview & Copilot', icon: 'sparkle' },
  { id: 'budget', label: 'Budget & Math', icon: 'wallet' },
  { id: 'venues', label: 'Venues & Halls / स्थल', icon: 'building' },
  { id: 'guests', label: 'Guest List & RSVPs', icon: 'users' },
  { id: 'timeline', label: 'Timeline & Tasks', icon: 'calendar' },
  { id: 'vendors', label: 'Vendors & Payments', icon: 'store' },
  { id: 'runsheet', label: 'Day-of Schedule', icon: 'clock' },
  { id: 'ideas', label: 'Ideas & Inspiration', icon: 'sparkle' },
  { id: 'analytics', label: 'Analytics & Readiness', icon: 'sparkle' },
];

/** Target tab index for a WAI-ARIA tabs key press (wrapping Arrow keys, Home, End); null if unhandled. */
function nextTabIndex(key: string, index: number, count: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

type NavBadges = NavigationProps['badges'];

interface BadgeSpec {
  /** Number shown (and the visibility test: hidden when 0). */
  count: (badges: NonNullable<NavBadges>) => number;
  /** Visible glyph replacing the number, hidden from assistive tech. */
  symbol?: string;
  /** Text alternative announced by screen readers. */
  srText: string;
  className: string;
}

const BADGE_SPECS: Partial<Record<TabId, BadgeSpec>> = {
  budget: {
    count: (b) => (b.budgetWarning ? 1 : 0),
    symbol: '!',
    srText: 'Over budget alert',
    className:
      'px-1.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
  venues: {
    count: (b) => b.venueCount ?? 0,
    srText: ' venues',
    className:
      'px-1.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
  timeline: {
    count: (b) => b.timelineOverdue ?? 0,
    srText: ' overdue tasks',
    className:
      'px-1.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
  guests: {
    count: (b) => b.guestCount ?? 0,
    srText: ' guests',
    className:
      'px-1.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300',
  },
};

/** Dynamic status badge for a tab (each has a text alternative; never colour-only). */
const TabBadge: FC<{ tabId: TabId; badges: NavBadges }> = ({ tabId, badges }) => {
  const spec = BADGE_SPECS[tabId];
  if (!spec || !badges) return null;
  const count = spec.count(badges);
  if (count <= 0) return null;
  return (
    <span className={spec.className}>
      {spec.symbol ? <span aria-hidden="true">{spec.symbol}</span> : count}
      <span className="sr-only">{spec.srText}</span>
    </span>
  );
};

export const Navigation: FC<NavigationProps> = ({ currentTab, onSelectTab, badges }) => {
  // WAI-ARIA APG tabs pattern with automatic activation:
  // roving tabindex + Arrow/Home/End keyboard navigation.
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = nextTabIndex(e.key, index, TABS.length);
    if (next === null) return;
    e.preventDefault();
    const nextTab = TABS[next];
    if (!nextTab) return;
    onSelectTab(nextTab.id);
    document.getElementById(`tab-${nextTab.id}`)?.focus();
  }

  return (
    <nav
      aria-label="Planning sections"
      className="no-print border-b border-stone-200/90 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm sticky top-[65px] z-20 overflow-x-auto scrollbar-none"
    >
      <div
        role="tablist"
        aria-label="Planning sections"
        aria-orientation="horizontal"
        className="max-w-7xl mx-auto px-4 flex items-center gap-1 sm:gap-2"
      >
        {TABS.map((tab, index) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex items-center gap-2 py-3.5 px-3 sm:px-4 min-h-[44px] text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all relative ${
                isActive
                  ? 'border-brand-700 dark:border-brand-500 text-brand-800 dark:text-brand-300 bg-brand-50/60 dark:bg-brand-950/20'
                  : 'border-transparent text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-400 dark:hover:border-stone-600'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4 shrink-0" />
              <span>
                <LangText text={tab.label} />
              </span>

              <TabBadge tabId={tab.id} badges={badges} />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
