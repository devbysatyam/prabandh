import { useCallback, useMemo, useState, type FC } from 'react';
import type { Guest, Plan, RsvpStatus } from '../../schemas';
import type { Action } from '../../state/planStore';
import { aggregateGuests, formatGuestWhatsappInvite } from '../../engine/guests';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { ALL } from './constants';
import { filterGuests } from './helpers';
import { GuestFilters } from './GuestFilters';
import { GuestForm } from './GuestForm';
import { GuestTable } from './GuestTable';
import { GuestsSummary } from './GuestsSummary';

interface GuestsTabProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

/** Guest list & RSVP manager tab. */
export const GuestsTab: FC<GuestsTabProps> = ({ plan, dispatch }) => {
  const summary = useMemo(() => aggregateGuests(plan.guestList), [plan.guestList]);
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<string>(ALL);
  const [rsvpFilter, setRsvpFilter] = useState<string>(ALL);
  const [showAddForm, setShowAddForm] = useState(false);
  const { copiedKey, copy } = useCopyToClipboard();

  const filteredGuests = useMemo(
    () => filterGuests(plan.guestList, sideFilter, rsvpFilter, search),
    [plan.guestList, sideFilter, rsvpFilter, search],
  );

  const handleSync = useCallback(() => dispatch({ type: 'syncGuestsWithList' }), [dispatch]);
  const openForm = useCallback(() => setShowAddForm(true), []);
  const closeForm = useCallback(() => setShowAddForm(false), []);
  const handleSave = useCallback(
    (guest: Guest) => {
      dispatch({ type: 'addGuest', guest });
      setShowAddForm(false);
    },
    [dispatch],
  );
  const handleRsvp = useCallback(
    (guest: Guest, rsvp: RsvpStatus) =>
      dispatch({ type: 'updateGuest', guest: { ...guest, rsvp } }),
    [dispatch],
  );
  const handleDelete = useCallback(
    (guestId: string) => dispatch({ type: 'deleteGuest', guestId }),
    [dispatch],
  );
  const handleCopyInvite = useCallback(
    (guest: Guest) => copy(formatGuestWhatsappInvite(guest, plan), guest.id),
    [copy, plan],
  );

  return (
    <div className="space-y-6">
      <GuestsSummary
        summary={summary}
        targetGuests={plan.guests}
        onSync={handleSync}
        onAdd={openForm}
      />

      {showAddForm && <GuestForm onSave={handleSave} onCancel={closeForm} />}

      <section className="card space-y-4">
        <GuestFilters
          search={search}
          sideFilter={sideFilter}
          rsvpFilter={rsvpFilter}
          onSearch={setSearch}
          onSide={setSideFilter}
          onRsvp={setRsvpFilter}
        />
        <GuestTable
          guests={filteredGuests}
          totalGuests={plan.guestList.length}
          copiedId={copiedKey}
          onRsvpChange={handleRsvp}
          onCopyInvite={handleCopyInvite}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
};
