import { useState, useMemo, type FC, type FormEvent } from 'react';
import type { DietPreference, Guest, GuestSide, Plan, RsvpStatus } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { aggregateGuests, formatGuestWhatsappInvite } from '../engine/guests';

interface GuestsTabProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

export const GuestsTab: FC<GuestsTabProps> = ({ plan, dispatch }) => {
  const summary = useMemo(() => aggregateGuests(plan.guestList), [plan.guestList]);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<string>('all');
  const [rsvpFilter, setRsvpFilter] = useState<string>('all');

  // New guest modal/form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [count, setCount] = useState(2);
  const [side, setSide] = useState<GuestSide>('bride');
  const [rsvp, setRsvp] = useState<RsvpStatus>('pending');
  const [diet, setDiet] = useState<DietPreference>('veg');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleAddGuest(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newGuest: Guest = {
      id: `g-${Date.now()}`,
      name: name.trim(),
      count: Math.max(1, count),
      side,
      rsvp,
      diet,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    dispatch({ type: 'addGuest', guest: newGuest });
    setName('');
    setCount(2);
    setPhone('');
    setNotes('');
    setShowAddForm(false);
  }

  function handleCopyInvite(guest: Guest) {
    const text = formatGuestWhatsappInvite(guest, plan);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(guest.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  }

  const filteredGuests = useMemo(() => {
    return plan.guestList.filter((g) => {
      if (sideFilter !== 'all' && g.side !== sideFilter) return false;
      if (rsvpFilter !== 'all' && g.rsvp !== rsvpFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          (g.phone && g.phone.includes(q)) ||
          (g.notes && g.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [plan.guestList, sideFilter, rsvpFilter, search]);

  return (
    <div className="space-y-6">
      {/* Top summary card */}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
              <Icon name="users" className="w-5 h-5 text-brand-600" />
              Guest List & RSVP Manager
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Manage families, sides, and meal preferences. Directly feeds the master headcount into
              catering calculations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'syncGuestsWithList' })}
              className="btn-secondary text-xs"
              title="Recalculate plan guest count from current list"
            >
              Sync Headcount ({summary.totalInvitedCount} Guests)
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn-primary text-xs"
            >
              <Icon name="plus" className="w-4 h-4" />
              Add Guest / Family
            </button>
          </div>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Total Headcount
            </span>
            <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
              {summary.totalInvitedCount}
            </p>
            <p className="text-[11px] text-stone-500">{summary.totalEntries} families listed</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Confirmed RSVPs
            </span>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {summary.confirmedCount}
            </p>
            <p className="text-[11px] text-stone-500">{summary.confirmationRate}% confirmed</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Pending Responses
            </span>
            <p className="text-2xl font-extrabold text-amber-500">{summary.pendingCount}</p>
            <p className="text-[11px] text-stone-500">Need follow-up</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Declined
            </span>
            <p className="text-2xl font-extrabold text-stone-400">{summary.declinedCount}</p>
            <p className="text-[11px] text-stone-500">Seats freed</p>
          </div>
        </div>

        {/* Dietary breakdown bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-stone-500">Dietary Needs:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
              🥬 Veg: {summary.byDiet.veg}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-medium">
              🌿 Jain (No root): {summary.byDiet.jain}
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-medium">
              🍗 Non-Veg: {summary.byDiet.non_veg}
            </span>
          </div>

          <div className="text-stone-400 text-[11px]">
            Target in Master Plan:{' '}
            <strong className="text-stone-700 dark:text-stone-200">{plan.guests} guests</strong>
          </div>
        </div>
      </section>

      {/* Add Guest Modal / Card */}
      {showAddForm && (
        <form
          onSubmit={handleAddGuest}
          className="card border-brand-300 dark:border-brand-900 bg-brand-50/20 dark:bg-brand-950/20 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Add Family / Guest Entry
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="guest-name-input"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Family / Guest Name
              </label>
              <input
                id="guest-name-input"
                aria-label="Family or guest name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sharma Family / Uncle Rajesh"
                className="input-base text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="guest-count-input"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Attendee Count
              </label>
              <input
                id="guest-count-input"
                aria-label="Number of attendees in family"
                type="number"
                min={1}
                max={50}
                required
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value || '1', 10))}
                className="input-base text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="guest-side-select"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Family Side
              </label>
              <select
                id="guest-side-select"
                aria-label="Family side"
                value={side}
                onChange={(e) => setSide(e.target.value as GuestSide)}
                className="input-base text-xs"
              >
                <option value="bride">Bride Side</option>
                <option value="groom">Groom Side</option>
                <option value="mutual">Mutual Friends</option>
                <option value="community">Community / Society</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="guest-rsvp-select"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                RSVP Status
              </label>
              <select
                id="guest-rsvp-select"
                aria-label="RSVP status"
                value={rsvp}
                onChange={(e) => setRsvp(e.target.value as RsvpStatus)}
                className="input-base text-xs"
              >
                <option value="pending">⏳ Pending Response</option>
                <option value="confirmed">✅ Confirmed</option>
                <option value="declined">❌ Declined</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="guest-diet-select"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Dietary Preference
              </label>
              <select
                id="guest-diet-select"
                aria-label="Dietary preference"
                value={diet}
                onChange={(e) => setDiet(e.target.value as DietPreference)}
                className="input-base text-xs"
              >
                <option value="veg">Pure Vegetarian</option>
                <option value="jain">Jain (No Root Veg)</option>
                <option value="non_veg">Non-Vegetarian</option>
                <option value="any">Any / Standard</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="guest-phone-input"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                WhatsApp Phone (Optional)
              </label>
              <input
                id="guest-phone-input"
                aria-label="WhatsApp phone number"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="input-base text-xs"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="guest-notes-input"
              className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
            >
              Notes / Special Requests
            </label>
            <input
              id="guest-notes-input"
              aria-label="Special requests and notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Elder needs ground floor room; outstation arrival on 18th"
              className="input-base text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Guest
            </button>
          </div>
        </form>
      )}

      {/* Guest List Filter & Table */}
      <section className="card space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              id="guest-search-input"
              aria-label="Search guests by name or notes"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests by name or notes..."
              className="input-base text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              id="guest-filter-side"
              aria-label="Filter guests by family side"
              value={sideFilter}
              onChange={(e) => setSideFilter(e.target.value)}
              className="input-base text-xs w-32"
            >
              <option value="all">All Sides</option>
              <option value="bride">Bride Side</option>
              <option value="groom">Groom Side</option>
              <option value="mutual">Mutual</option>
              <option value="community">Community</option>
            </select>

            <select
              id="guest-filter-rsvp"
              aria-label="Filter guests by RSVP status"
              value={rsvpFilter}
              onChange={(e) => setRsvpFilter(e.target.value)}
              className="input-base text-xs w-32"
            >
              <option value="all">All RSVPs</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredGuests.length === 0 ? (
          <div className="text-center py-10 text-stone-500">
            <Icon name="users" className="w-8 h-8 mx-auto mb-2 text-stone-400" />
            <p className="font-semibold text-sm">No Guests Found</p>
            <p className="text-xs text-stone-400 mt-1">
              {plan.guestList.length === 0
                ? 'Add your first family or guest entry to track RSVPs and catering requirements.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Guest / Family</th>
                  <th className="py-2.5 px-3">Seats</th>
                  <th className="py-2.5 px-3">Side</th>
                  <th className="py-2.5 px-3">RSVP Status</th>
                  <th className="py-2.5 px-3">Diet</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                    <td className="py-3 px-3 font-semibold text-stone-900 dark:text-stone-100">
                      {guest.name}
                      {guest.phone && (
                        <span className="block text-[11px] text-stone-400 font-normal">
                          {guest.phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-stone-700 dark:text-stone-300">
                      {guest.count}
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {guest.side}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        aria-label={`RSVP status for ${guest.name}`}
                        value={guest.rsvp}
                        onChange={(e) => {
                          dispatch({
                            type: 'updateGuest',
                            guest: { ...guest, rsvp: e.target.value as RsvpStatus },
                          });
                        }}
                        className={`text-[11px] font-bold rounded-lg px-2 py-1 border ${
                          guest.rsvp === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : guest.rsvp === 'declined'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize text-stone-600 dark:text-stone-300">
                        {guest.diet}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-400 italic max-w-xs truncate">
                      {guest.notes ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyInvite(guest)}
                          className="btn-quiet text-emerald-600 hover:bg-emerald-50"
                          title="Copy personalized WhatsApp invitation text"
                        >
                          <Icon name="whatsapp" className="w-3.5 h-3.5" />
                          <span>{copiedId === guest.id ? 'Copied!' : 'Invite'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'deleteGuest', guestId: guest.id })}
                          className="p-1 rounded text-stone-400 hover:text-red-600"
                          title="Delete Guest"
                        >
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
