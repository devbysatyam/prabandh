import type { FC } from 'react';
import type { Plan, Vendor } from '../../schemas';
import type { Action } from '../../state/planStore';
import { Icon } from '../Icon';
import { VendorCard } from './VendorCard';

interface BookedViewProps {
  plan: Plan;
  dispatch: (action: Action) => void;
  onAddVendor: () => void;
  onLogTasting: (vendor: Vendor) => void;
  onAddMilestone: (vendorId: string) => void;
}

/** Sub-view 4: vendors with contracts and payment milestones. */
export const BookedView: FC<BookedViewProps> = ({
  plan,
  dispatch,
  onAddVendor,
  onLogTasting,
  onAddMilestone,
}) => (
  <section className="space-y-4">
    {plan.vendors.length === 0 ? (
      <div className="card text-center py-10 space-y-3">
        <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 mx-auto flex items-center justify-center">
          <Icon name="store" className="w-6 h-6" />
        </div>
        <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
          No Booked Vendors Yet
        </h5>
        <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
          Use the Sourcing Checklist or Quote Comparison to lock in vendors and generate payment
          schedules.
        </p>
        <button type="button" onClick={onAddVendor} className="btn-primary text-xs">
          + Add Vendor Manually
        </button>
      </div>
    ) : (
      plan.vendors.map((vendor) => (
        <VendorCard
          key={vendor.id}
          vendor={vendor}
          occasion={plan.occasion}
          dispatch={dispatch}
          onLogTasting={onLogTasting}
          onAddMilestone={onAddMilestone}
        />
      ))
    )}
  </section>
);
