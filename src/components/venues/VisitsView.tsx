import { memo } from 'react';
import type { SiteVisit } from '../../schemas';
import { Icon } from '../Icon';
import { VisitCard } from './VisitCard';

interface VisitsViewProps {
  siteVisits: readonly SiteVisit[];
  onLogVisit: () => void;
  onDeleteVisit: (visitId: string) => void;
}

/** Sub-view 2: site visits and physical walkthrough log. */
export const VisitsView = memo(function VisitsView({
  siteVisits,
  onLogVisit,
  onDeleteVisit,
}: VisitsViewProps) {
  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Venue Site Recce & Physical Walkthrough Logs (<span lang="hi">स्थल निरीक्षण</span>)
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Track in-person property visits with family members. Check air conditioning, stage
              height, acoustic sound curfew compliance, and food tastings.
            </p>
          </div>
          <button type="button" onClick={onLogVisit} className="btn-primary text-xs">
            + Log New Site Visit
          </button>
        </div>
      </div>

      {siteVisits.length === 0 ? (
        <div className="card text-center py-10 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Icon name="check" className="w-6 h-6" />
          </div>
          <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
            No Site Visits Logged Yet
          </h5>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            Schedule or record family visits to your shortlisted venues to compare air conditioning
            cooling, stage space, washroom hygiene, and live food tasting sessions.
          </p>
          <button type="button" onClick={onLogVisit} className="btn-primary text-xs">
            + Record First Site Visit
          </button>
        </div>
      ) : (
        siteVisits.map((visit) => (
          <VisitCard key={visit.id} visit={visit} onDelete={onDeleteVisit} />
        ))
      )}
    </div>
  );
});
