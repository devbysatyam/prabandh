import type { FC, FormEvent } from 'react';
import type { Category, Plan } from '../../schemas';
import { Field, TEXT_BUTTON_CLASS } from '../ui/Field';
import { CategorySelect } from './CategorySelect';

/** Fields of the add-vendor form. */
export interface AddVendorDraft {
  name: string;
  category: Category;
  phone: string;
}

interface AddVendorFormProps {
  occasion: Plan['occasion'];
  draft: AddVendorDraft;
  onChange: (changes: Partial<AddVendorDraft>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

/** Form to add a shortlisted vendor manually. */
export const AddVendorForm: FC<AddVendorFormProps> = ({
  occasion,
  draft,
  onChange,
  onSubmit,
  onCancel,
}) => (
  <form onSubmit={onSubmit} className="card border-stone-300 dark:border-stone-700 space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">Add New Vendor</h4>
      <button type="button" onClick={onCancel} className={TEXT_BUTTON_CLASS}>
        Cancel
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field htmlFor="add-vendor-name" label="Vendor Name">
        <input
          id="add-vendor-name"
          aria-label="Vendor or business name"
          type="text"
          required
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Royal Caterers / DJ Sunny"
          className="input-base text-xs"
        />
      </Field>
      <Field htmlFor="add-vendor-category" label="Category">
        <CategorySelect
          id="add-vendor-category"
          ariaLabel="Vendor category"
          value={draft.category}
          occasion={occasion}
          onChange={(category) => onChange({ category })}
        />
      </Field>
      <Field htmlFor="add-vendor-phone" label="Contact Phone (WhatsApp)">
        <input
          id="add-vendor-phone"
          aria-label="Vendor WhatsApp contact phone"
          type="text"
          value={draft.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="+91 98765 43210"
          className="input-base text-xs"
        />
      </Field>
    </div>
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="btn-secondary text-xs">
        Cancel
      </button>
      <button type="submit" className="btn-primary text-xs">
        Save Vendor
      </button>
    </div>
  </form>
);
