import { useCallback, useMemo, useState, type FC } from 'react';
import type { Plan, PlanReview } from '../../schemas';
import { budgetStatus, diffDays, planInsights } from '../../engine';
import { aggregateGuests } from '../../engine/guests';
import { api } from '../../lib/api';
import type { TabId } from '../Navigation';
import { CopilotChatbox } from './CopilotChatbox';
import { InsightsList } from './InsightsList';
import { MetricsGrid } from './MetricsGrid';
import { ReviewBanner } from './ReviewBanner';
import { SectionExplorer } from './SectionExplorer';
import { useCopilot } from './useCopilot';

interface OverviewTabProps {
  plan: Plan;
  today: string;
  onNavigate: (tab: TabId) => void;
}

/** Overview dashboard: metrics, section shortcuts, AI plan review, insights and copilot chat. */
export const OverviewTab: FC<OverviewTabProps> = ({ plan, today, onNavigate }) => {
  const status = useMemo(() => budgetStatus(plan), [plan]);
  const guests = useMemo(() => aggregateGuests(plan.guestList), [plan.guestList]);
  const insights = useMemo(() => planInsights(plan, today), [plan, today]);
  const daysLeft = diffDays(today, plan.eventDate);

  const chat = useCopilot(plan, today);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState<PlanReview | null>(null);

  const runReview = useCallback(() => {
    setIsReviewing(true);
    api
      .reviewPlan(plan, today)
      .then(setReview)
      .catch(() => undefined)
      .finally(() => setIsReviewing(false));
  }, [plan, today]);

  return (
    <div className="space-y-6">
      <MetricsGrid plan={plan} status={status} guests={guests} daysLeft={daysLeft} />
      <SectionExplorer plan={plan} status={status} guests={guests} onNavigate={onNavigate} />
      <ReviewBanner review={review} isReviewing={isReviewing} onRunReview={runReview} />
      <InsightsList insights={insights} onNavigate={onNavigate} />
      <CopilotChatbox chat={chat} />
    </div>
  );
};
