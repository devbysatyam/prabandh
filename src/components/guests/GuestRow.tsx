import { memo, type FC } from 'react';
import type { Guest, RsvpStatus } from '../../schemas';
import { Icon } from '../Icon';
import { RSVP_SELECT_CLASS } from './constants';

interface GuestRowProps {
  guest: Guest;
  copied: boolean;
  onRsvpChange: (guest: Guest, rsvp: RsvpStatus) => void;
  onCopyInvite: (guest: Guest) => void;
  onDelete: (guestId: string) => void;
}

/** One table row of the guest list. */
export const GuestRow: FC<GuestRowProps> = memo(
  ({ guest, copied, onRsvpChange, onCopyInvite, onDelete }) => (
    <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
      <th
        scope="row"
        className="py-3 px-3 font-semibold text-stone-900 dark:text-stone-100 text-left"
      >
        {guest.name}
        {guest.phone && (
          <span className="block text-[11px] text-stone-600 dark:text-stone-400 font-normal">
            {guest.phone}
          </span>
        )}
      </th>
      <td className="py-3 px-3 font-bold text-stone-700 dark:text-stone-300">{guest.count}</td>
      <td className="py-3 px-3">
        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          {guest.side}
        </span>
      </td>
      <td className="py-3 px-3">
        <select
          aria-label={`RSVP status for ${guest.name}`}
          value={guest.rsvp}
          onChange={(e) => onRsvpChange(guest, e.target.value as RsvpStatus)}
          className={`text-[11px] font-bold rounded-lg px-2 py-1 border ${RSVP_SELECT_CLASS[guest.rsvp]}`}
        >
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
        </select>
      </td>
      <td className="py-3 px-3">
        <span className="capitalize text-stone-600 dark:text-stone-300">{guest.diet}</span>
      </td>
      <td className="py-3 px-3 text-stone-600 dark:text-stone-400 italic max-w-xs truncate">
        {guest.notes ?? '—'}
      </td>
      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onCopyInvite(guest)}
            className="btn-quiet text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
            title="Copy personalized WhatsApp invitation text"
          >
            <Icon name="whatsapp" className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Invite'}</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(guest.id)}
            className="p-1 rounded text-stone-600 dark:text-stone-400 hover:text-red-600"
            title="Delete Guest"
            aria-label="Delete Guest"
          >
            <Icon name="trash" className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  ),
);
GuestRow.displayName = 'GuestRow';
