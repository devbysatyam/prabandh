import type { FC } from 'react';
import type { Plan, Vendor, VendorStatus } from '../../schemas';
import type { Action } from '../../state/planStore';
import { calculateVendorPayments } from '../../engine/vendors';
import { formatINR } from '../../engine/money';
import { Icon } from '../Icon';
import { categoryLabel } from './helpers';

interface VendorCardProps {
  vendor: Vendor;
  occasion: Plan['occasion'];
  dispatch: (action: Action) => void;
  onLogTasting: (vendor: Vendor) => void;
  onAddMilestone: (vendorId: string) => void;
}

const SmallButton: FC<{ onClick: () => void; children: string }> = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="btn-secondary text-xs">
    {children}
  </button>
);

function PaymentSchedule({
  vendor,
  dispatch,
}: {
  vendor: Vendor;
  dispatch: (action: Action) => void;
}) {
  return (
    <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80">
      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block mb-2">
        Payment Installment Schedule
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {vendor.payments.map((pm) => (
          <div
            key={pm.id}
            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
              pm.status === 'paid'
                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
            }`}
          >
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">{pm.title}</p>
              <p className="text-stone-600 dark:text-stone-400 font-semibold">
                {formatINR(pm.amount)}
              </p>
              <p className="text-[10px] text-stone-600 dark:text-stone-400">Due: {pm.dueDate}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                dispatch({ type: 'togglePayment', vendorId: vendor.id, paymentId: pm.id })
              }
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                pm.status === 'paid'
                  ? 'bg-emerald-700 text-white'
                  : 'border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-500'
              }`}
            >
              {pm.status === 'paid' ? '✓ Paid' : 'Mark Paid'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A booked/shortlisted vendor with status, payment totals and installment schedule. */
export const VendorCard: FC<VendorCardProps> = ({
  vendor,
  occasion,
  dispatch,
  onLogTasting,
  onAddMilestone,
}) => {
  const payments = calculateVendorPayments(vendor);
  return (
    <div className="card border border-stone-200 dark:border-stone-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
              {vendor.name}
            </h4>
            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {categoryLabel(occasion, vendor.category)}
            </span>
            <select
              aria-label={`Status for vendor ${vendor.name}`}
              value={vendor.status}
              onChange={(e) =>
                dispatch({
                  type: 'updateVendor',
                  vendor: { ...vendor, status: e.target.value as VendorStatus },
                })
              }
              className="text-xs font-bold rounded-lg border border-stone-200 dark:border-stone-700 px-2 py-0.5 bg-white dark:bg-stone-900"
            >
              <option value="shortlisted">Shortlisted</option>
              <option value="contacted">Contacted</option>
              <option value="quoted">Quoted</option>
              <option value="booked">Booked & Locked</option>
            </select>
          </div>
          {vendor.phone && (
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">{vendor.phone}</p>
          )}
        </div>

        <div className="text-right flex items-center gap-4">
          <div>
            <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-400 uppercase">
              Paid / Total
            </span>
            <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              {formatINR(payments.totalPaid)} / {formatINR(payments.totalAgreed)}
            </p>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              {payments.balanceRemaining > 0
                ? `Balance: ${formatINR(payments.balanceRemaining)}`
                : 'Fully Paid'}
            </p>
          </div>

          <SmallButton onClick={() => onLogTasting(vendor)}>+ Tasting Visit</SmallButton>
          <SmallButton onClick={() => onAddMilestone(vendor.id)}>+ Payment Milestone</SmallButton>
          <button
            type="button"
            onClick={() => dispatch({ type: 'deleteVendor', vendorId: vendor.id })}
            className="p-1 rounded text-stone-600 dark:text-stone-400 hover:text-red-600"
            title="Delete Vendor"
            aria-label="Delete Vendor"
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {vendor.payments.length > 0 && <PaymentSchedule vendor={vendor} dispatch={dispatch} />}
    </div>
  );
};
