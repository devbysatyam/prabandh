import type { FC } from 'react';
import { Icon, type IconName } from './Icon';

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
  badges?: {
    overview?: number;
    budgetWarning?: boolean;
    venueCount?: number;
    guestCount?: number;
    timelineOverdue?: number;
    vendorPending?: number;
  };
}

const TABS: { id: TabId; label: string; icon: IconName }[] = [
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

export const Navigation: FC<NavigationProps> = ({ currentTab, onSelectTab, badges }) => {
  return (
    <nav
      role="tablist"
      aria-label="Planning Sections"
      className="no-print border-b border-stone-200/90 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm sticky top-[65px] z-20 overflow-x-auto scrollbar-none"
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 sm:gap-2">
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all relative ${
                isActive
                  ? 'border-brand-600 dark:border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/40 dark:bg-brand-950/20'
                  : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>

              {/* Dynamic status badges */}
              {tab.id === 'budget' && badges?.budgetWarning && (
                <span
                  className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  title="Over budget alert"
                />
              )}
              {tab.id === 'venues' && (badges?.venueCount ?? 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {badges?.venueCount}
                </span>
              )}
              {tab.id === 'timeline' && (badges?.timelineOverdue ?? 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {badges?.timelineOverdue}
                </span>
              )}
              {tab.id === 'guests' && (badges?.guestCount ?? 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  {badges?.guestCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
