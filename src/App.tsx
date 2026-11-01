import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { usePlanStore } from './state/planStore';
import type { Intake, Plan } from './schemas';
import { Header } from './components/Header';
import { Navigation, TABS, type TabId } from './components/Navigation';
import { LangText } from './components/LangText';
import { PlanSetup } from './components/PlanSetup';
import { QuickNav } from './components/QuickNav';
import { TabContent } from './components/TabContent';
import { ToastRegion } from './components/ToastRegion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WhatsAppModal } from './components/WhatsAppModal';
import { PrintSummary } from './components/PrintSummary';
import { budgetStatus } from './engine/budget';
import { buildSchedule } from './engine/timeline';

const DOCUMENT_TITLE_SUFFIX = 'Prabandh · Connected Indian Celebration Architecture';

/** Navigation badge counts derived from the plan. */
function computeBadges(plan: Plan, today: string) {
  const schedule = buildSchedule(plan.tasks, plan.eventDate, today);
  return {
    budgetWarning: budgetStatus(plan).isOverBudget,
    venueCount: (plan.venues ?? []).length,
    guestCount: plan.guestList.length,
    timelineOverdue: schedule.filter((t) => t.isOverdue).length,
  };
}

/** Application shell: header, navigation, active tab, toast, dialogs and print view. */
export const App: FC = () => {
  const { state, dispatch, clearToast } = usePlanStore();
  const [currentTab, setCurrentTab] = useState<TabId>('overview');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const currentTabLabel = TABS.find((t) => t.id === currentTab)?.label ?? 'Overview';

  // WCAG 2.4.2: keep the document title in sync with the visible section
  useEffect(() => {
    document.title = `${currentTabLabel} · ${DOCUMENT_TITLE_SUFFIX}`;
  }, [currentTabLabel]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { plan } = state;
  const badges = useMemo(() => (plan ? computeBadges(plan, today) : undefined), [plan, today]);

  const handleReset = useCallback(() => dispatch({ type: 'reset' }), [dispatch]);
  const openWhatsApp = useCallback(() => setShowWhatsAppModal(true), []);
  const closeWhatsApp = useCallback(() => setShowWhatsAppModal(false), []);
  const handleCreate = useCallback(
    (intake: Intake) => {
      dispatch({ type: 'create', intake });
      setCurrentTab('overview');
    },
    [dispatch],
  );
  const handleLoadSample = useCallback(() => {
    dispatch({ type: 'loadSamplePlan' });
    setCurrentTab('overview');
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-sand-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      <a href="#main-content" className="skip-link no-print">
        Skip to main content
      </a>
      <Header plan={plan} today={today} onReset={handleReset} onOpenWhatsAppModal={openWhatsApp} />

      {plan ? (
        <>
          <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} badges={badges} />

          <main
            id="main-content"
            tabIndex={-1}
            className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 focus:outline-none"
          >
            <div
              role="tabpanel"
              id={`panel-${currentTab}`}
              aria-labelledby={`tab-${currentTab}`}
              tabIndex={0}
              className="rounded-xl"
            >
              <h2 className="sr-only">
                <LangText text={currentTabLabel} />
              </h2>
              <TabContent
                tab={currentTab}
                plan={plan}
                today={today}
                dispatch={dispatch}
                onNavigate={setCurrentTab}
              />
            </div>
          </main>

          <QuickNav currentTab={currentTab} onSelectTab={setCurrentTab} />
        </>
      ) : (
        <main
          id="main-content"
          tabIndex={-1}
          className="no-print flex-1 flex items-center justify-center py-6 focus:outline-none"
        >
          <PlanSetup today={today} onCreate={handleCreate} onLoadSample={handleLoadSample} />
        </main>
      )}

      <ToastRegion toast={state.toast} onDismiss={clearToast} />

      <footer className="no-print border-t border-stone-200 dark:border-stone-800 px-4 py-4 text-center text-xs text-stone-600 dark:text-stone-400">
        <LangText text="Prabandh · प्रबंध" /> — your plan data stays in this browser.
      </footer>

      {showWhatsAppModal && plan && (
        <WhatsAppModal plan={plan} today={today} onClose={closeWhatsApp} />
      )}

      {plan && <PrintSummary plan={plan} today={today} />}
    </div>
  );
};

/** Root component wrapped in an app-level error boundary. */
const AppWithBoundary: FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithBoundary;
