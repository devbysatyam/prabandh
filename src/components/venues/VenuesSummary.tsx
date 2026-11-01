import { memo, type FC } from 'react';
import type { VenueDetail } from '../../schemas';
import { formatINR } from '../../engine/money';
import { Icon } from '../Icon';
import { SegmentedTabs } from '../ui/Field';
import type { VenueSubView } from './constants';

const METRIC_LABEL =
  'text-[11px] font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider';
const METRIC_CAPTION = 'text-[11px] text-stone-600 dark:text-stone-400';

interface MetricProps {
  label: string;
  caption: string;
  valueClassName: string;
  children: string | number;
}

const Metric: FC<MetricProps> = ({ label, caption, valueClassName, children }) => (
  <div>
    <span className={METRIC_LABEL}>{label}</span>
    <p className={valueClassName}>{children}</p>
    <p className={METRIC_CAPTION}>{caption}</p>
  </div>
);

interface VenuesSummaryProps {
  venueCount: number;
  visitCount: number;
  venueBudget: number;
  bookedVenue: VenueDetail | undefined;
  subView: VenueSubView;
  onSubViewChange: (view: VenueSubView) => void;
  onLogVisit: () => void;
  onAddVenue: () => void;
}

/** Header card: title, primary actions, key metrics and the sub-view switcher. */
export const VenuesSummary = memo(function VenuesSummary({
  venueCount,
  visitCount,
  venueBudget,
  bookedVenue,
  subView,
  onSubViewChange,
  onLogVisit,
  onAddVenue,
}: VenuesSummaryProps) {
  const tabs = [
    { id: 'properties', label: `1. Properties & Halls (${venueCount})` },
    { id: 'visits', label: `2. Site Recce & In-Person Visits (${visitCount})` },
  ] as const;

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
            <Icon name="building" className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            Venue & Property Management (<span lang="hi">स्थल प्रबंधन</span>)
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Shortlist and compare banquets, lawns, and heritage resorts. Evaluate capacity fits,
            kitchen catering policies, and log in-person physical site visits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onLogVisit} className="btn-secondary text-xs">
            <Icon name="check" className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Log Site Recce Visit
          </button>
          <button type="button" onClick={onAddVenue} className="btn-primary text-xs">
            <Icon name="plus" className="w-4 h-4" />
            Shortlist New Venue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-stone-100 dark:border-stone-800">
        <Metric
          label="Shortlisted"
          caption="Properties under review"
          valueClassName="text-2xl font-extrabold text-stone-900 dark:text-stone-100"
        >
          {venueCount}
        </Metric>
        <Metric
          label="Site Visits Done"
          caption="Physical walkthroughs"
          valueClassName="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400"
        >
          {visitCount}
        </Metric>
        <Metric
          label="Venue Budget"
          caption="Allocated in Master Budget"
          valueClassName="text-2xl font-extrabold text-amber-700 dark:text-amber-400"
        >
          {formatINR(venueBudget)}
        </Metric>
        <Metric
          label="Booked Venue"
          caption={bookedVenue ? 'Date & Token Locked' : 'Action Required'}
          valueClassName="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 truncate mt-1"
        >
          {bookedVenue ? bookedVenue.name : 'None Locked Yet'}
        </Metric>
      </div>

      <SegmentedTabs tabs={tabs} active={subView} onChange={onSubViewChange} />
    </section>
  );
});
