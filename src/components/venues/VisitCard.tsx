import { memo, type FC } from 'react';
import type { SiteVisit } from '../../schemas';
import { Icon } from '../Icon';
import { MAX_RATING } from './constants';

const BADGE_BASE = 'px-2.5 py-1 rounded-lg border font-semibold';
const BADGE_OK =
  'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
const BADGE_TASTING_OK =
  'bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800';
const BADGE_OFF = 'bg-stone-100 text-stone-600 border-stone-200';

interface BadgeProps {
  ok: boolean;
  okText: string;
  offText: string;
  okClass?: string;
}

const CheckBadge: FC<BadgeProps> = ({ ok, okText, offText, okClass = BADGE_OK }) => (
  <span className={`${BADGE_BASE} ${ok ? okClass : BADGE_OFF}`}>{ok ? okText : offText}</span>
);

interface VisitCardProps {
  visit: SiteVisit;
  onDelete: (visitId: string) => void;
}

/** A logged in-person site visit with its inspection badges and notes. */
export const VisitCard = memo(function VisitCard({ visit, onDelete }: VisitCardProps) {
  return (
    <div className="card border border-stone-200 dark:border-stone-800 space-y-3 bg-white dark:bg-stone-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
              {visit.venueName}
            </h4>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              <span aria-hidden="true">
                {'★'.repeat(visit.rating)}
                {'☆'.repeat(MAX_RATING - visit.rating)}
              </span>
              <span className="sr-only">
                Rated {visit.rating} out of {MAX_RATING}
              </span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {visit.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            <span aria-hidden="true">📅</span> Date: {visit.visitDate} ·{' '}
            <span aria-hidden="true">👥</span> Attendees: {visit.attendees}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(visit.id)}
          className="p-1 rounded text-stone-600 dark:text-stone-400 hover:text-red-600"
          title="Delete Visit Log"
          aria-label="Delete Visit Log"
        >
          <Icon name="trash" className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <CheckBadge ok={visit.acWorking} okText="✓ AC Tested & Cool" offText="✕ AC Issue" />
        <CheckBadge
          ok={visit.bridalRoomClean}
          okText="✓ Bridal Rooms Clean"
          offText="✕ Rooms Need Work"
        />
        <CheckBadge
          ok={visit.soundCurfewOk}
          okText="✓ 23:00 Curfew Clear"
          offText="✕ Strict Curfew Risk"
        />
        <CheckBadge
          ok={visit.parkingAdequate}
          okText="✓ Parking & Valet OK"
          offText="✕ Limited Parking"
        />
        <CheckBadge
          ok={visit.tastingDone}
          okText="✓ Food Tasting Done"
          offText="○ Tasting Pending"
          okClass={BADGE_TASTING_OK}
        />
      </div>

      {(visit.tastingNotes || visit.notes) && (
        <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          {visit.tastingNotes && (
            <p className="text-stone-700 dark:text-stone-300">
              <strong className="text-brand-700 dark:text-brand-400">
                <span aria-hidden="true">🍲</span> Food Tasting:
              </strong>{' '}
              {visit.tastingNotes}
            </p>
          )}
          {visit.notes && (
            <p className="text-stone-600 dark:text-stone-400">
              <strong>
                <span aria-hidden="true">📝</span> Walkthrough Notes:
              </strong>{' '}
              {visit.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
