import { memo, type FC } from 'react';
import type { SiteVisit, VenueDetail } from '../../schemas';
import { Icon } from '../Icon';
import { VenueCard } from './VenueCard';

interface PropertiesViewProps {
  venues: readonly VenueDetail[];
  siteVisits: readonly SiteVisit[];
  guests: number;
  copiedId: string | null;
  onAddVenue: () => void;
  onLogVisit: (venueId: string) => void;
  onSetStatus: (venue: VenueDetail, status: VenueDetail['status']) => void;
  onDelete: (venueId: string) => void;
  onCopyInquiry: (venue: VenueDetail) => void;
}

const EmptyVenues: FC<{ onAddVenue: () => void }> = ({ onAddVenue }) => (
  <div className="card text-center py-10 space-y-3">
    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
      <Icon name="building" className="w-6 h-6" />
    </div>
    <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
      No Venues Shortlisted Yet
    </h5>
    <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
      Add banquets, lawns, or hotel ballrooms to evaluate their capacity and curfew against your
      celebration needs.
    </p>
    <button type="button" onClick={onAddVenue} className="btn-primary text-xs">
      + Shortlist First Venue
    </button>
  </div>
);

/** Sub-view 1: shortlisted properties. */
export const PropertiesView = memo(function PropertiesView({
  venues,
  siteVisits,
  guests,
  copiedId,
  onAddVenue,
  onLogVisit,
  onSetStatus,
  onDelete,
  onCopyInquiry,
}: PropertiesViewProps) {
  if (venues.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyVenues onAddVenue={onAddVenue} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {venues.map((venue) => (
        <VenueCard
          key={venue.id}
          venue={venue}
          guests={guests}
          isVisited={venue.status === 'visited' || siteVisits.some((v) => v.venueId === venue.id)}
          copied={copiedId === venue.id}
          onLogVisit={onLogVisit}
          onSetStatus={onSetStatus}
          onDelete={onDelete}
          onCopyInquiry={onCopyInquiry}
        />
      ))}
    </div>
  );
});
