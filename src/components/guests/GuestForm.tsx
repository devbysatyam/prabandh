import { memo, useState, type FC, type FormEvent } from 'react';
import type { DietPreference, Guest, GuestSide, RsvpStatus } from '../../schemas';
import { Field, TEXT_BUTTON_CLASS } from '../ui/Field';
import {
  DEFAULT_ATTENDEE_COUNT,
  DEFAULT_DIET,
  DEFAULT_RSVP,
  DEFAULT_SIDE,
  DIET_OPTIONS,
  MAX_ATTENDEES,
  MIN_ATTENDEES,
  RSVP_OPTIONS,
  SIDE_OPTIONS,
} from './constants';
import { buildGuest } from './helpers';

interface GuestFormProps {
  onSave: (guest: Guest) => void;
  onCancel: () => void;
}

/** Add Family / Guest form; owns its draft state and emits a normalised Guest on submit. */
export const GuestForm: FC<GuestFormProps> = memo(({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [count, setCount] = useState(DEFAULT_ATTENDEE_COUNT);
  const [side, setSide] = useState<GuestSide>(DEFAULT_SIDE);
  const [rsvp, setRsvp] = useState<RsvpStatus>(DEFAULT_RSVP);
  const [diet, setDiet] = useState<DietPreference>(DEFAULT_DIET);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(buildGuest({ name, count, side, rsvp, diet, phone, notes }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card border-brand-300 dark:border-brand-900 bg-brand-50/20 dark:bg-brand-950/20 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
          Add Family / Guest Entry
        </h4>
        <button type="button" onClick={onCancel} className={TEXT_BUTTON_CLASS}>
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field htmlFor="guest-name-input" label="Family / Guest Name">
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
        </Field>

        <Field htmlFor="guest-count-input" label="Attendee Count">
          <input
            id="guest-count-input"
            aria-label="Number of attendees in family"
            type="number"
            min={MIN_ATTENDEES}
            max={MAX_ATTENDEES}
            required
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value || String(MIN_ATTENDEES), 10))}
            className="input-base text-xs"
          />
        </Field>

        <Field htmlFor="guest-side-select" label="Family Side">
          <select
            id="guest-side-select"
            aria-label="Family side"
            value={side}
            onChange={(e) => setSide(e.target.value as GuestSide)}
            className="input-base text-xs"
          >
            {SIDE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field htmlFor="guest-rsvp-select" label="RSVP Status">
          <select
            id="guest-rsvp-select"
            aria-label="RSVP status"
            value={rsvp}
            onChange={(e) => setRsvp(e.target.value as RsvpStatus)}
            className="input-base text-xs"
          >
            {RSVP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field htmlFor="guest-diet-select" label="Dietary Preference">
          <select
            id="guest-diet-select"
            aria-label="Dietary preference"
            value={diet}
            onChange={(e) => setDiet(e.target.value as DietPreference)}
            className="input-base text-xs"
          >
            {DIET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field htmlFor="guest-phone-input" label="WhatsApp Phone (Optional)">
          <input
            id="guest-phone-input"
            aria-label="WhatsApp phone number"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="input-base text-xs"
          />
        </Field>
      </div>

      <Field htmlFor="guest-notes-input" label="Notes / Special Requests">
        <input
          id="guest-notes-input"
          aria-label="Special requests and notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Elder needs ground floor room; outstation arrival on 18th"
          className="input-base text-xs"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-xs">
          Cancel
        </button>
        <button type="submit" className="btn-primary text-xs">
          Save Guest
        </button>
      </div>
    </form>
  );
});
GuestForm.displayName = 'GuestForm';
