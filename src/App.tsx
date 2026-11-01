import { useState, useMemo, type FC } from 'react';
import { usePlanStore } from './state/planStore';
import { Header } from './components/Header';
import { Navigation, type TabId } from './components/Navigation';
import { PlanSetup } from './components/PlanSetup';
import { OverviewTab } from './components/OverviewTab';
import { BudgetTab } from './components/BudgetTab';
import { VenuesTab } from './components/VenuesTab';
import { GuestsTab } from './components/GuestsTab';
import { TimelineTab } from './components/TimelineTab';
import { VendorsTab } from './components/VendorsTab';
import { RunSheetTab } from './components/RunSheetTab';
import { IdeasTab } from './components/IdeasTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { WhatsAppModal } from './components/WhatsAppModal';
import { PrintSummary } from './components/PrintSummary';
import { budgetStatus } from './engine/budget';
import { buildSchedule } from './engine/timeline';

export const App: FC = () => {
  const { state, dispatch, clearToast } = usePlanStore();
  const [currentTab, setCurrentTab] = useState<TabId>('overview');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const plan = state.plan;

  // Compute status badges for navigation tabs
  const badges = useMemo(() => {
    if (!plan) return undefined;
    const bStatus = budgetStatus(plan);
    const schedule = buildSchedule(plan.tasks, plan.eventDate, today);
    const overdueTasks = schedule.filter((t) => t.isOverdue);

    return {
      budgetWarning: bStatus.isOverBudget,
      venueCount: (plan.venues ?? []).length,
      guestCount: plan.guestList.length,
      timelineOverdue: overdueTasks.length,
    };
  }, [plan, today]);

  return (
    <div className="min-h-screen flex flex-col bg-sand-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      <Header
        plan={plan}
        today={today}
        onReset={() => dispatch({ type: 'reset' })}
        onOpenWhatsAppModal={() => setShowWhatsAppModal(true)}
      />

      {plan ? (
        <>
          <Navigation
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            badges={badges}
          />

          <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {currentTab === 'setup' && (
              <PlanSetup
                today={today}
                plan={plan}
                onUpdate={(intake) => {
                  dispatch({ type: 'updateIntake', intake });
                  setCurrentTab('overview');
                }}
              />
            )}
            {currentTab === 'overview' && (
              <OverviewTab plan={plan} today={today} onNavigate={setCurrentTab} />
            )}
            {currentTab === 'budget' && (
              <BudgetTab plan={plan} dispatch={dispatch} />
            )}
            {currentTab === 'venues' && (
              <VenuesTab plan={plan} dispatch={dispatch} />
            )}
            {currentTab === 'guests' && (
              <GuestsTab plan={plan} dispatch={dispatch} />
            )}
            {currentTab === 'timeline' && (
              <TimelineTab plan={plan} today={today} dispatch={dispatch} />
            )}
            {currentTab === 'vendors' && (
              <VendorsTab plan={plan} dispatch={dispatch} />
            )}
            {currentTab === 'runsheet' && (
              <RunSheetTab plan={plan} dispatch={dispatch} />
            )}
            {currentTab === 'ideas' && <IdeasTab plan={plan} />}
            {currentTab === 'analytics' && (
              <AnalyticsTab plan={plan} today={today} onNavigate={setCurrentTab} />
            )}
          </main>

          {/* Floating Section Quick-Jump Switcher */}
          <div className="no-print fixed bottom-6 left-6 z-40">
            <div className="relative">
              {showQuickNav && (
                <div className="absolute bottom-12 left-0 mb-2 w-64 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-2.5 space-y-1 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Visit Any Section (अनुभाग दौरा)
                  </div>
                  {[
                    { id: 'overview', label: '1. Overview & AI Review', icon: 'sparkle' },
                    { id: 'venues', label: '2. Venues & Recce Visits', icon: 'building' },
                    { id: 'vendors', label: '3. Vendors & Food Tastings', icon: 'briefcase' },
                    { id: 'budget', label: '4. Budget & Trade-offs', icon: 'wallet' },
                    { id: 'guests', label: '5. Guests & RSVP Manager', icon: 'users' },
                    { id: 'timeline', label: '6. Milestone Timeline', icon: 'calendar' },
                    { id: 'runsheet', label: '7. Day-of Live Runsheet', icon: 'clock' },
                    { id: 'ideas', label: '8. AI Creative Themes', icon: 'lightbulb' },
                    { id: 'analytics', label: '9. Analytics & Health', icon: 'sparkle' },
                    { id: 'setup', label: '10. Event Vision & Setup', icon: 'pencil' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setCurrentTab(s.id as TabId);
                        setShowQuickNav(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition ${
                        currentTab === s.id
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <span>{s.label}</span>
                      {currentTab === s.id && <span className="text-[10px]">● Active</span>}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowQuickNav(!showQuickNav)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold shadow-xl border border-stone-800 dark:border-stone-200 hover:scale-105 transition"
                title="Quick Section Navigator"
              >
                <span>⚡ Visit Sections</span>
                <span className="text-[10px] opacity-75 font-mono">({currentTab})</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <main className="no-print flex-1 flex items-center justify-center py-6">
          <PlanSetup
            today={today}
            onCreate={(intake) => {
              dispatch({ type: 'create', intake });
              setCurrentTab('overview');
            }}
            onLoadSample={() => {
              dispatch({ type: 'loadSamplePlan' });
              setCurrentTab('overview');
            }}
          />
        </main>
      )}

      {/* Floating Action Toast */}
      {state.toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs sm:text-sm font-semibold shadow-xl border border-stone-800 dark:border-stone-200 animate-bounce"
        >
          <span>{state.toast.message}</span>
          <button
            type="button"
            onClick={clearToast}
            className="text-stone-400 hover:text-white dark:hover:text-stone-900 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Family WhatsApp Broadcast Modal */}
      {showWhatsAppModal && plan && (
        <WhatsAppModal
          plan={plan}
          today={today}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {/* Clean 1-Page Print View */}
      {plan && <PrintSummary plan={plan} today={today} />}
    </div>
  );
};

export default App;
