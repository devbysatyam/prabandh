import { memo, type FC } from 'react';
import type { VendorMeeting } from '../../schemas';
import type { Action } from '../../state/planStore';
import { Icon } from '../Icon';
import { MAX_RATING } from './constants';

interface TastingsViewProps {
  meetings: VendorMeeting[];
  dispatch: (action: Action) => void;
  onLogTasting: () => void;
}

const MeetingCard: FC<{ meeting: VendorMeeting; dispatch: (action: Action) => void }> = memo(
  ({ meeting, dispatch }) => (
    <div className="card border border-stone-200 dark:border-stone-800 space-y-3 bg-white dark:bg-stone-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
              {meeting.vendorName}
            </h4>
            <span className="capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {meeting.meetingType.replace('_', ' ')}
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              <span aria-hidden="true">
                {'★'.repeat(meeting.rating)}
                {'☆'.repeat(MAX_RATING - meeting.rating)}
              </span>
              <span className="sr-only">
                Rated {meeting.rating} out of {MAX_RATING}
              </span>
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            <span aria-hidden="true">📅</span> Date: {meeting.meetingDate} ·{' '}
            <span aria-hidden="true">👥</span> Attendees: {meeting.attendees}
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: 'deleteVendorMeeting', meetingId: meeting.id })}
          className="p-1 rounded text-stone-600 dark:text-stone-400 hover:text-red-600"
          title="Delete Meeting Log"
          aria-label="Delete Meeting Log"
        >
          <Icon name="trash" className="w-4 h-4" />
        </button>
      </div>

      {meeting.dishesOrItemsTested && (
        <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 text-xs">
          <span className="font-semibold text-brand-700 dark:text-brand-400 block mb-0.5">
            Items / Dishes Sampled:
          </span>
          <p className="text-stone-800 dark:text-stone-200">{meeting.dishesOrItemsTested}</p>
        </div>
      )}

      <div className="text-xs space-y-1">
        <span className="font-semibold text-stone-600 dark:text-stone-400 block">
          Feedback & Recipe Adjustments:
        </span>
        <p className="text-stone-700 dark:text-stone-300 italic">{meeting.feedback}</p>
      </div>
    </div>
  ),
);
MeetingCard.displayName = 'MeetingCard';

/** Sub-view 3: logged tastings and trial visits. */
export const TastingsView: FC<TastingsViewProps> = ({ meetings, dispatch, onLogTasting }) => (
  <section className="space-y-4">
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
            Supplier Tasting & Trial Visits (<span lang="hi">सप्लायर मुलाक़ात व चखना सत्र</span>)
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Record food tastings with caterers, bridal makeup trials, mandap mockup walkthroughs,
            and DJ sound tests.
          </p>
        </div>
        <button type="button" onClick={onLogTasting} className="btn-primary text-xs">
          + Log Tasting / Trial Visit
        </button>
      </div>
    </div>

    {meetings.length === 0 ? (
      <div className="card text-center py-10 space-y-3">
        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mx-auto flex items-center justify-center">
          <Icon name="check" className="w-6 h-6" />
        </div>
        <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
          No Tasting or Trial Visits Logged Yet
        </h5>
        <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto">
          Schedule a food tasting session with your shortlisted caterer to sample main course
          gravies, live chaat, and sweets before locking in your booking.
        </p>
        <button type="button" onClick={onLogTasting} className="btn-primary text-xs">
          + Record First Tasting Session
        </button>
      </div>
    ) : (
      meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} dispatch={dispatch} />
      ))
    )}
  </section>
);
