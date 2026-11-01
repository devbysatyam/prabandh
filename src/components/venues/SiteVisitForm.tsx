import { memo, type FormEvent } from 'react';
import type { VenueDetail } from '../../schemas';
import { Icon } from '../Icon';
import { LABEL_CLASS, TEXT_BUTTON_CLASS } from '../ui/Field';
import { RATING_OPTIONS } from './constants';
import { SelectField, TextAreaField, TextField } from './fields';
import type { VisitFormState } from './helpers';

type CheckKey =
  'acWorking' | 'bridalRoomClean' | 'soundCurfewOk' | 'parkingAdequate' | 'tastingDone';

const CHECKLIST: readonly { key: CheckKey; id: string; ariaLabel: string; text: string }[] = [
  {
    key: 'acWorking',
    id: 'visit-ac-working',
    ariaLabel: 'Air Conditioning Tested and Effective',
    text: 'Air Conditioning Tested & Effective',
  },
  {
    key: 'bridalRoomClean',
    id: 'visit-bridal-room',
    ariaLabel: 'Bridal Rooms and Washrooms Clean',
    text: 'Bridal Rooms & Washrooms Clean',
  },
  {
    key: 'soundCurfewOk',
    id: 'visit-sound-curfew',
    ariaLabel: 'Music Curfew 23:00 Clarified',
    text: 'Music Curfew (23:00) Clarified',
  },
  {
    key: 'parkingAdequate',
    id: 'visit-parking-adequate',
    ariaLabel: 'Parking and Valet Access Confirmed',
    text: 'Parking & Valet Access Confirmed',
  },
  {
    key: 'tastingDone',
    id: 'visit-tasting-done',
    ariaLabel: 'Food Tasting and Kitchen Inspected',
    text: 'Food Tasting / Kitchen Inspected',
  },
];

interface SiteVisitFormProps {
  venues: readonly VenueDetail[];
  form: VisitFormState;
  setField: <K extends keyof VisitFormState>(key: K, value: VisitFormState[K]) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

/** "Record In-Person Site Visit" form with the physical walkthrough checklist. */
export const SiteVisitForm = memo(function SiteVisitForm({
  venues,
  form,
  setField,
  onSubmit,
  onCancel,
}: SiteVisitFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="card border-emerald-300 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Icon name="check" className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          Record In-Person Site Visit & Recce (<span lang="hi">स्थल दौरा व निरीक्षण</span>)
        </h4>
        <button type="button" onClick={onCancel} className={TEXT_BUTTON_CLASS}>
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SelectField
          id="visit-venue-select"
          label="Property Visited"
          ariaLabel="Property Visited"
          value={form.venueId}
          onChange={(v) => setField('venueId', v)}
        >
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </SelectField>
        <TextField
          id="visit-date-input"
          label="Date of Visit"
          ariaLabel="Date of Site Visit"
          type="date"
          required
          value={form.visitDate}
          onChange={(v) => setField('visitDate', v)}
        />
        <TextField
          id="visit-attendees-input"
          label="Visitors / Family Members Present"
          ariaLabel="Visitors and Family Members Present"
          required
          value={form.attendees}
          onChange={(v) => setField('attendees', v)}
          placeholder="e.g. Groom's Parents, Bride's Brother & Uncle"
        />
      </div>

      <fieldset>
        <legend className={`${LABEL_CLASS} font-bold uppercase tracking-wider mb-2`}>
          Physical Walkthrough Inspection Checklist
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CHECKLIST.map((item) => (
            <label
              key={item.key}
              htmlFor={item.id}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium cursor-pointer"
            >
              <input
                id={item.id}
                aria-label={item.ariaLabel}
                type="checkbox"
                checked={form[item.key]}
                onChange={(e) => setField(item.key, e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 dark:text-emerald-400"
              />
              {item.text}
            </label>
          ))}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium">
            <label htmlFor="visit-rating-select" className="cursor-pointer">
              Overall Rating:
            </label>
            <select
              id="visit-rating-select"
              aria-label="Overall Site Visit Rating"
              value={form.rating}
              onChange={(e) => setField('rating', parseInt(e.target.value, 10))}
              className="font-bold text-amber-700 dark:text-amber-400 border-none bg-transparent"
            >
              {RATING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextAreaField
          id="visit-tasting-notes"
          label="Food Tasting Notes (if applicable)"
          ariaLabel="Food Tasting Notes"
          value={form.tastingNotes}
          onChange={(v) => setField('tastingNotes', v)}
          placeholder="e.g. Tried sample live chaat counters, paneer tikka, and dessert. Fresh and well-seasoned."
        />
        <TextAreaField
          id="visit-meeting-notes"
          label="Manager Meeting & Discussion Notes"
          ariaLabel="Manager Meeting and Discussion Notes"
          value={form.notes}
          onChange={(v) => setField('notes', v)}
          placeholder="e.g. Spoke with manager Mr. Deshmukh. Agreed to 25% booking token, generator fuel included."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-xs">
          Cancel
        </button>
        <button type="submit" className="btn-primary text-xs">
          Save Site Visit Log
        </button>
      </div>
    </form>
  );
});
