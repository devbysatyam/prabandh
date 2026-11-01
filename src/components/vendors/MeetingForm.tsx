import type { FC, FormEvent } from 'react';
import type { Plan, Vendor, VendorMeeting } from '../../schemas';
import { Icon } from '../Icon';
import { Field, TEXT_BUTTON_CLASS } from '../ui/Field';
import { RATING_OPTIONS } from './constants';
import type { MeetingDraft } from './helpers';

interface MeetingFormProps {
  vendors: Vendor[];
  draft: MeetingDraft;
  onChange: (changes: Partial<MeetingDraft>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

/** Find the vendor whose name matches (case-insensitively) so category/id follow along. */
function matchVendor(vendors: Plan['vendors'], name: string): Vendor | undefined {
  const lower = name.toLowerCase();
  return vendors.find((v) => v.name.toLowerCase() === lower);
}

/** Form to log a supplier tasting / trial / in-person visit. */
export const MeetingForm: FC<MeetingFormProps> = ({
  vendors,
  draft,
  onChange,
  onSubmit,
  onCancel,
}) => (
  <form
    onSubmit={onSubmit}
    className="card border-indigo-300 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3"
  >
    <div className="flex items-center justify-between">
      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
        <Icon name="check" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        Record Supplier Tasting & In-Person Trial Visit (
        <span lang="hi">सप्लायर मुलाक़ात व चखना</span>)
      </h4>
      <button type="button" onClick={onCancel} className={TEXT_BUTTON_CLASS}>
        Cancel
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field htmlFor="meeting-vendor-name" label="Vendor Name">
        <input
          id="meeting-vendor-name"
          aria-label="Vendor name for tasting or trial"
          type="text"
          required
          value={draft.vendorName}
          onChange={(e) => {
            const found = matchVendor(vendors, e.target.value);
            onChange(
              found
                ? { vendorName: e.target.value, vendorId: found.id, category: found.category }
                : { vendorName: e.target.value },
            );
          }}
          placeholder="e.g. Royal Awadhi Caterers / MUA Simran"
          className="input-base text-xs"
        />
      </Field>
      <Field htmlFor="meeting-type-select" label="Meeting / Visit Type">
        <select
          id="meeting-type-select"
          aria-label="Meeting or visit type"
          value={draft.meetingType}
          onChange={(e) =>
            onChange({ meetingType: e.target.value as VendorMeeting['meetingType'] })
          }
          className="input-base text-xs"
        >
          <option value="food_tasting" lang="hi">
            Food Tasting Session (भोजन चखना)
          </option>
          <option value="makeup_trial">Bridal Makeup / Styling Trial</option>
          <option value="decor_mockup">Mandap & Floral Mockup Walkthrough</option>
          <option value="sound_check">DJ & Orchestra Acoustic Sound Check</option>
          <option value="contract_discussion">In-Person Contract Negotiation</option>
        </select>
      </Field>
      <Field htmlFor="meeting-date-input" label="Date of Meeting">
        <input
          id="meeting-date-input"
          aria-label="Date of meeting or food tasting"
          type="date"
          required
          value={draft.meetingDate}
          onChange={(e) => onChange({ meetingDate: e.target.value })}
          className="input-base text-xs"
        />
      </Field>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field
        htmlFor="meeting-dishes-input"
        label="Dishes / Items Sampled or Tested"
        className="sm:col-span-2"
      >
        <input
          id="meeting-dishes-input"
          aria-label="Dishes or menu items sampled"
          type="text"
          value={draft.dishes}
          onChange={(e) => onChange({ dishes: e.target.value })}
          placeholder="e.g. Paneer Lababdar, Live Jalebi, Dal Bukhara, Airbrush Makeup"
          className="input-base text-xs"
        />
      </Field>
      <Field htmlFor="meeting-rating-select" label="Overall Impression / Rating">
        <select
          id="meeting-rating-select"
          aria-label="Tasting rating out of 5 stars"
          value={draft.rating}
          onChange={(e) => onChange({ rating: parseInt(e.target.value, 10) })}
          className="input-base text-xs font-bold text-amber-700 dark:text-amber-400"
        >
          {RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field htmlFor="meeting-attendees-input" label="Attendees Present">
        <input
          id="meeting-attendees-input"
          aria-label="Attendees present at meeting"
          type="text"
          value={draft.attendees}
          onChange={(e) => onChange({ attendees: e.target.value })}
          placeholder="e.g. Both families, Groom & Bride"
          className="input-base text-xs"
        />
      </Field>
      <Field htmlFor="meeting-feedback-input" label="Feedback & Recipe Adjustments">
        <input
          id="meeting-feedback-input"
          aria-label="Tasting feedback and recipe adjustments"
          type="text"
          required
          value={draft.feedback}
          onChange={(e) => onChange({ feedback: e.target.value })}
          placeholder="e.g. Delicious sweets, requested slightly less spice in Dal Makhani"
          className="input-base text-xs"
        />
      </Field>
    </div>

    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="btn-secondary text-xs">
        Cancel
      </button>
      <button type="submit" className="btn-primary text-xs">
        Save Tasting Visit Log
      </button>
    </div>
  </form>
);
