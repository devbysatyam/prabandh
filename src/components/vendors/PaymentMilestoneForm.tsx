import type { FC, FormEvent } from 'react';
import { Field, TEXT_BUTTON_CLASS } from '../ui/Field';
import { MIN_MILESTONE_AMOUNT } from './constants';

/** Fields of the payment-milestone form. */
export interface MilestoneDraft {
  title: string;
  amount: number;
  due: string;
}

interface PaymentMilestoneFormProps {
  draft: MilestoneDraft;
  onChange: (changes: Partial<MilestoneDraft>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

/** Form to add an installment milestone to a vendor. */
export const PaymentMilestoneForm: FC<PaymentMilestoneFormProps> = ({
  draft,
  onChange,
  onSubmit,
  onCancel,
}) => (
  <form onSubmit={onSubmit} className="card border-brand-300 bg-brand-50/20 space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
        Add Payment Installment Milestone
      </h4>
      <button type="button" onClick={onCancel} className={TEXT_BUTTON_CLASS}>
        Cancel
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field htmlFor="milestone-title-input" label="Milestone Title">
        <input
          id="milestone-title-input"
          aria-label="Milestone payment title"
          type="text"
          required
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. 50% Advance / Stage Completion"
          className="input-base text-xs"
        />
      </Field>
      <Field htmlFor="milestone-amount-input" label="Amount (INR ₹)">
        <input
          id="milestone-amount-input"
          aria-label="Milestone payment amount in rupees"
          type="number"
          min={MIN_MILESTONE_AMOUNT}
          required
          value={draft.amount}
          onChange={(e) => onChange({ amount: parseInt(e.target.value || '1', 10) })}
          className="input-base text-xs"
        />
      </Field>
      <Field htmlFor="milestone-due-date" label="Due Date">
        <input
          id="milestone-due-date"
          aria-label="Milestone payment due date"
          type="date"
          required
          value={draft.due}
          onChange={(e) => onChange({ due: e.target.value })}
          className="input-base text-xs"
        />
      </Field>
    </div>
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="btn-secondary text-xs">
        Cancel
      </button>
      <button type="submit" className="btn-primary text-xs">
        Save Milestone
      </button>
    </div>
  </form>
);
