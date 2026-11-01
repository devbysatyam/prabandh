import { memo, type FC } from 'react';
import type { Guest, RsvpStatus } from '../../schemas';
import { Icon } from '../Icon';
import { GuestRow } from './GuestRow';

interface GuestTableProps {
  guests: readonly Guest[];
  totalGuests: number;
  copiedId: string | null;
  onRsvpChange: (guest: Guest, rsvp: RsvpStatus) => void;
  onCopyInvite: (guest: Guest) => void;
  onDelete: (guestId: string) => void;
}

const COLUMNS = ['Guest / Family', 'Seats', 'Side', 'RSVP Status', 'Diet', 'Notes'] as const;

/** Guest table, or an empty-state message when nothing matches. */
export const GuestTable: FC<GuestTableProps> = memo(
  ({ guests, totalGuests, copiedId, ...handlers }) => {
    if (guests.length === 0) {
      return (
        <div className="text-center py-10 text-stone-600 dark:text-stone-400">
          <Icon name="users" className="w-8 h-8 mx-auto mb-2 text-stone-600 dark:text-stone-400" />
          <p className="font-semibold text-sm">No Guests Found</p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {totalGuests === 0
              ? 'Add your first family or guest entry to track RSVPs and catering requirements.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            Guest list with seats, family side, RSVP status, diet and notes
          </caption>
          <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 uppercase tracking-wider text-[10px]">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className="py-2.5 px-3">
                  {c}
                </th>
              ))}
              <th scope="col" className="py-2.5 px-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {guests.map((guest) => (
              <GuestRow key={guest.id} guest={guest} copied={copiedId === guest.id} {...handlers} />
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);
GuestTable.displayName = 'GuestTable';
