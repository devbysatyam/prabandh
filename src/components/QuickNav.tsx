import { memo, useEffect, useState } from 'react';
import type { TabId } from './Navigation';

const QUICK_NAV_ITEMS: readonly { id: TabId; label: string }[] = [
  { id: 'overview', label: '1. Overview & AI Review' },
  { id: 'venues', label: '2. Venues & Recce Visits' },
  { id: 'vendors', label: '3. Vendors & Food Tastings' },
  { id: 'budget', label: '4. Budget & Trade-offs' },
  { id: 'guests', label: '5. Guests & RSVP Manager' },
  { id: 'timeline', label: '6. Milestone Timeline' },
  { id: 'runsheet', label: '7. Day-of Live Runsheet' },
  { id: 'ideas', label: '8. AI Creative Themes' },
  { id: 'analytics', label: '9. Analytics & Health' },
  { id: 'setup', label: '10. Event Vision & Setup' },
];

interface QuickNavProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

/** Floating "Visit Sections" disclosure menu (APG disclosure pattern, Escape closes). */
export const QuickNav = memo(function QuickNav({ currentTab, onSelectTab }: QuickNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        document.getElementById('quick-nav-toggle')?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav aria-label="Quick section jump" className="no-print fixed bottom-6 left-6 z-40">
      <div className="relative">
        {open && (
          <div
            id="quick-nav-menu"
            className="absolute bottom-12 left-0 mb-2 w-64 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-2.5 space-y-1 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Visit Any Section (<span lang="hi">अनुभाग दौरा</span>)
            </p>
            {QUICK_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={currentTab === item.id ? 'page' : undefined}
                onClick={() => {
                  onSelectTab(item.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition ${
                  currentTab === item.id
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <span>{item.label}</span>
                {currentTab === item.id && <span className="text-[10px]">● Active</span>}
              </button>
            ))}
          </div>
        )}

        <button
          id="quick-nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="quick-nav-menu"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold shadow-xl border border-stone-800 dark:border-stone-200 hover:scale-105 transition"
        >
          <span>
            <span aria-hidden="true">⚡</span> Visit Sections
          </span>
          <span className="text-[10px] font-mono">({currentTab})</span>
        </button>
      </div>
    </nav>
  );
});
