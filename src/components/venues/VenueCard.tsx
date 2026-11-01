import { memo, type FC } from 'react';
import type { VenueDetail } from '../../schemas';
import { evaluateVenue } from '../../engine/venues';
import { formatINR } from '../../engine/money';
import { Icon } from '../Icon';

type CapacityStatus = ReturnType<typeof evaluateVenue>['capacityStatus'];

const CAPACITY_BANNER: Record<CapacityStatus, string> = {
  optimal:
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900',
  cramped:
    'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900',
  excessive:
    'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
};

function cardClass(isBooked: boolean, isVisited: boolean): string {
  if (isBooked) {
    return 'border-emerald-500/80 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/20';
  }
  if (isVisited) return 'border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-stone-900';
  return 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900';
}

const FACT_BOX =
  'p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800';

const Fact: FC<{ label: string; children: string }> = ({ label, children }) => (
  <div className={FACT_BOX}>
    <span className="text-[10px] text-stone-600 dark:text-stone-400 block font-semibold">
      {label}
    </span>
    <span className="font-semibold text-stone-800 dark:text-stone-200">{children}</span>
  </div>
);

/** Venue name, type, status badges and address. */
const VenueTitle: FC<{ venue: VenueDetail; isBooked: boolean; isVisited: boolean }> = ({
  venue,
  isBooked,
  isVisited,
}) => (
  <div>
    <div className="flex items-center gap-2">
      <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100">{venue.name}</h4>
      <span className="capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
        {venue.type.replace('_', ' ')}
      </span>
      {isBooked && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          ✓ Booked Venue
        </span>
      )}
      {isVisited && !isBooked && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          Walkthrough Visited
        </span>
      )}
    </div>
    {venue.address && (
      <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
        <span aria-hidden="true">📍</span> {venue.address}
      </p>
    )}
  </div>
);

interface VenueRentalAndActionsProps {
  venue: VenueDetail;
  isBooked: boolean;
  onLogVisit: (venueId: string) => void;
  onSetStatus: (venue: VenueDetail, status: VenueDetail['status']) => void;
  onDelete: (venueId: string) => void;
}

/** Rental cost summary with log-visit, lock and remove actions. */
const VenueRentalAndActions: FC<VenueRentalAndActionsProps> = ({
  venue,
  isBooked,
  onLogVisit,
  onSetStatus,
  onDelete,
}) => (
  <div className="text-right flex items-center gap-3">
    <div>
      <span className="text-[10px] text-stone-600 dark:text-stone-400 font-semibold block uppercase">
        Rental + Deposit
      </span>
      <p className="font-bold text-base text-stone-900 dark:text-stone-100">
        {formatINR(venue.rentalCost)}
      </p>
      <p className="text-[11px] text-stone-600 dark:text-stone-400">
        +{formatINR(venue.cautionDeposit)} caution deposit
      </p>
    </div>

    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onLogVisit(venue.id)}
        className="btn-secondary text-xs"
        title="Record Site Recce Visit"
      >
        + Log Visit
      </button>
      <button
        type="button"
        onClick={() => onSetStatus(venue, isBooked ? 'shortlisted' : 'booked')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
          isBooked
            ? 'bg-emerald-700 text-white shadow-sm'
            : 'border border-stone-300 dark:border-stone-700 hover:border-emerald-500 text-stone-700 dark:text-stone-200'
        }`}
      >
        {isBooked ? '✓ Venue Locked' : 'Lock This Venue'}
      </button>
      <button
        type="button"
        onClick={() => onDelete(venue.id)}
        className="p-1 rounded text-stone-600 dark:text-stone-400 hover:text-red-600"
        title="Remove venue"
        aria-label="Remove venue"
      >
        <Icon name="trash" className="w-4 h-4" />
      </button>
    </div>
  </div>
);

interface VenueCardProps {
  venue: VenueDetail;
  guests: number;
  isVisited: boolean;
  copied: boolean;
  onLogVisit: (venueId: string) => void;
  onSetStatus: (venue: VenueDetail, status: VenueDetail['status']) => void;
  onDelete: (venueId: string) => void;
  onCopyInquiry: (venue: VenueDetail) => void;
}

/** A single shortlisted property with capacity fit, policies and actions. */
export const VenueCard = memo(function VenueCard({
  venue,
  guests,
  isVisited,
  copied,
  onLogVisit,
  onSetStatus,
  onDelete,
  onCopyInquiry,
}: VenueCardProps) {
  const evalRes = evaluateVenue(venue, guests);
  const isBooked = venue.status === 'booked';

  return (
    <div className={`card border transition space-y-3.5 ${cardClass(isBooked, isVisited)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <VenueTitle venue={venue} isBooked={isBooked} isVisited={isVisited} />

        <VenueRentalAndActions
          venue={venue}
          isBooked={isBooked}
          onLogVisit={onLogVisit}
          onSetStatus={onSetStatus}
          onDelete={onDelete}
        />
      </div>

      <div
        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${CAPACITY_BANNER[evalRes.capacityStatus]}`}
      >
        <Icon
          name={evalRes.capacityStatus === 'optimal' ? 'check' : 'alert'}
          className="w-4 h-4 shrink-0"
        />
        <span>{evalRes.capacityMessage}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className={FACT_BOX}>
          <span className="text-[10px] text-stone-600 dark:text-stone-400 block font-semibold">
            Catering Policy
          </span>
          <span className="font-semibold text-stone-800 dark:text-stone-200 capitalize">
            {venue.cateringPolicy.replace('_', ' ')}
          </span>
        </div>
        <Fact label="Music Curfew">{venue.curfewTime}</Fact>
        <Fact label="AC Green Rooms">{`${venue.roomsIncluded} Rooms Included`}</Fact>
        <Fact label="Valet / Parking">{`~${venue.parkingCapacity} Cars`}</Fact>
      </div>

      {venue.notes && (
        <p className="text-xs text-stone-600 dark:text-stone-400 italic bg-stone-50/50 dark:bg-stone-900/50 p-2.5 rounded-lg border border-stone-200/50 dark:border-stone-800">
          Notes: {venue.notes}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSetStatus(venue, isVisited ? 'shortlisted' : 'visited')}
            className={`btn-quiet text-xs ${isVisited ? 'text-indigo-600 font-bold' : ''}`}
          >
            {isVisited ? '✓ Walkthrough Completed' : 'Mark Visited'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onCopyInquiry(venue)}
          className="btn-secondary text-xs"
        >
          <Icon name="whatsapp" className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          {copied ? 'WhatsApp Enquiry Copied!' : 'Copy WhatsApp Enquiry for Venue'}
        </button>
      </div>
    </div>
  );
});
