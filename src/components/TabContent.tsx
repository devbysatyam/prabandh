import { lazy, Suspense, type ReactNode } from 'react';
import type { Plan } from '../schemas';
import type { Action } from '../state/planStore';
import type { TabId } from './Navigation';
import { ErrorBoundary } from './ErrorBoundary';
import { OverviewTab } from './OverviewTab';
import { PlanSetup } from './PlanSetup';

const BudgetTab = lazy(() => import('./BudgetTab').then((m) => ({ default: m.BudgetTab })));
const VenuesTab = lazy(() => import('./VenuesTab').then((m) => ({ default: m.VenuesTab })));
const GuestsTab = lazy(() => import('./GuestsTab').then((m) => ({ default: m.GuestsTab })));
const TimelineTab = lazy(() => import('./TimelineTab').then((m) => ({ default: m.TimelineTab })));
const VendorsTab = lazy(() => import('./VendorsTab').then((m) => ({ default: m.VendorsTab })));
const RunSheetTab = lazy(() => import('./RunSheetTab').then((m) => ({ default: m.RunSheetTab })));
const IdeasTab = lazy(() => import('./IdeasTab').then((m) => ({ default: m.IdeasTab })));
const AnalyticsTab = lazy(() =>
  import('./AnalyticsTab').then((m) => ({ default: m.AnalyticsTab })),
);

interface TabContentProps {
  tab: TabId;
  plan: Plan;
  today: string;
  dispatch: (action: Action) => void;
  onNavigate: (tab: TabId) => void;
}

const TAB_RENDERERS: Record<TabId, (props: TabContentProps) => ReactNode> = {
  setup: ({ plan, today, dispatch, onNavigate }) => (
    <PlanSetup
      today={today}
      plan={plan}
      onUpdate={(intake) => {
        dispatch({ type: 'updateIntake', intake });
        onNavigate('overview');
      }}
    />
  ),
  overview: ({ plan, today, onNavigate }) => (
    <OverviewTab plan={plan} today={today} onNavigate={onNavigate} />
  ),
  budget: ({ plan, dispatch }) => <BudgetTab plan={plan} dispatch={dispatch} />,
  venues: ({ plan, dispatch }) => <VenuesTab plan={plan} dispatch={dispatch} />,
  guests: ({ plan, dispatch }) => <GuestsTab plan={plan} dispatch={dispatch} />,
  timeline: ({ plan, today, dispatch }) => (
    <TimelineTab plan={plan} today={today} dispatch={dispatch} />
  ),
  vendors: ({ plan, dispatch }) => <VendorsTab plan={plan} dispatch={dispatch} />,
  runsheet: ({ plan, dispatch }) => <RunSheetTab plan={plan} dispatch={dispatch} />,
  ideas: ({ plan }) => <IdeasTab plan={plan} />,
  analytics: ({ plan, today, onNavigate }) => (
    <AnalyticsTab plan={plan} today={today} onNavigate={onNavigate} />
  ),
};

function renderTab(props: TabContentProps): ReactNode {
  return TAB_RENDERERS[props.tab](props);
}

/** Renders the active tab: code-split (React.lazy) and isolated by an error boundary per tab. */
export function TabContent(props: TabContentProps) {
  return (
    <ErrorBoundary key={props.tab}>
      <Suspense
        fallback={
          <p role="status" className="p-6 text-sm text-stone-600 dark:text-stone-400">
            Loading section…
          </p>
        }
      >
        {renderTab(props)}
      </Suspense>
    </ErrorBoundary>
  );
}
