import { memo, type FormEvent } from 'react';
import type { CateringPolicy, VenueType } from '../../schemas';
import { Icon } from '../Icon';
import { TEXT_BUTTON_CLASS } from '../ui/Field';
import { CATERING_POLICY_OPTIONS, VENUE_TYPE_OPTIONS } from './constants';
import { NumberField, SelectField, TextField } from './fields';
import type { VenueFormState } from './helpers';

interface VenueFormProps {
  form: VenueFormState;
  setField: <K extends keyof VenueFormState>(key: K, value: VenueFormState[K]) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

/** "Add Venue for Evaluation" form. */
export const VenueForm = memo(function VenueForm({
  form,
  setField,
  onSubmit,
  onCancel,
}: VenueFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="card border-amber-300 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/20 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Icon name="plus" className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          Add Venue for Evaluation
        </h4>
        <button type="button" onClick={onCancel} className={TEXT_BUTTON_CLASS}>
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TextField
          className="sm:col-span-2"
          id="venue-name-input"
          label="Venue / Property Name"
          ariaLabel="Venue or Property Name"
          required
          value={form.name}
          onChange={(v) => setField('name', v)}
          placeholder="e.g. Royal Palace Banquet & Lawns / Amaltas Heritage Resort"
        />
        <SelectField
          id="venue-type-select"
          label="Property Type"
          ariaLabel="Property Type"
          value={form.type}
          onChange={(v) => setField('type', v as VenueType)}
        >
          {VENUE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumberField
          id="venue-min-capacity"
          label="Min Capacity"
          ariaLabel="Minimum Guest Capacity"
          required
          value={form.capacityMin}
          onChange={(v) => setField('capacityMin', v)}
        />
        <NumberField
          id="venue-max-capacity"
          label="Max Capacity"
          ariaLabel="Maximum Guest Capacity"
          required
          value={form.capacityMax}
          onChange={(v) => setField('capacityMax', v)}
        />
        <NumberField
          id="venue-rental-cost"
          label="Rental Cost (₹)"
          ariaLabel="Venue Rental Cost in Indian Rupees"
          required
          value={form.rentalCost}
          onChange={(v) => setField('rentalCost', v)}
        />
        <NumberField
          id="venue-caution-deposit"
          label="Caution Deposit (₹)"
          ariaLabel="Refundable Caution Deposit in Indian Rupees"
          required
          value={form.cautionDeposit}
          onChange={(v) => setField('cautionDeposit', v)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <SelectField
          id="venue-catering-policy"
          label="Catering Policy"
          ariaLabel="Catering Policy"
          value={form.cateringPolicy}
          onChange={(v) => setField('cateringPolicy', v as CateringPolicy)}
        >
          {CATERING_POLICY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        <TextField
          id="venue-curfew-time"
          label="Sound Curfew Time"
          ariaLabel="Sound Curfew Time"
          value={form.curfewTime}
          onChange={(v) => setField('curfewTime', v)}
          placeholder="23:00 / 10:00 PM"
        />
        <NumberField
          id="venue-rooms-included"
          label="Bridal Rooms Included"
          ariaLabel="Bridal Rooms Included"
          value={form.roomsIncluded}
          onChange={(v) => setField('roomsIncluded', v)}
        />
        <NumberField
          id="venue-parking-capacity"
          label="Parking Capacity (Cars)"
          ariaLabel="Parking Capacity in Cars"
          value={form.parkingCapacity}
          onChange={(v) => setField('parkingCapacity', v)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          id="venue-address-input"
          label="Address / Location"
          ariaLabel="Venue Address and Location"
          value={form.address}
          onChange={(v) => setField('address', v)}
          placeholder="e.g. Near Hinjawadi Flyover, Pune"
        />
        <TextField
          id="venue-notes-input"
          label="Notes / First Impressions"
          ariaLabel="Venue Notes and First Impressions"
          value={form.notes}
          onChange={(v) => setField('notes', v)}
          placeholder="e.g. Spacious lawn, grand entrance, generator backup available"
        />
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor="venue-alcohol-allowed"
          className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
        >
          <input
            id="venue-alcohol-allowed"
            aria-label="Alcohol and Bar Setup Permitted with excise license"
            type="checkbox"
            checked={form.alcoholAllowed}
            onChange={(e) => setField('alcoholAllowed', e.target.checked)}
            className="w-4 h-4 rounded text-amber-700 dark:text-amber-400 focus:ring-amber-500"
          />
          Alcohol / Bar Setup Permitted (with 1-day excise license)
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-xs">
          Cancel
        </button>
        <button type="submit" className="btn-primary text-xs">
          Save Venue
        </button>
      </div>
    </form>
  );
});
