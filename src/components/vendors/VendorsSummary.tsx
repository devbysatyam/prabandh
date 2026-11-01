import { memo, type FC, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { SegmentedTabs } from '../ui/Field';
import type { SubView } from './constants';

interface VendorsSummaryProps {
  subView: SubView;
  onSubViewChange: (view: SubView) => void;
  bookedCount: number;
  categoryCount: number;
  contactedCount: number;
  meetingCount: number;
  quoteCount: number;
  vendorCount: number;
  onLogTasting: () => void;
  onAnalyzeQuote: () => void;
  onAddVendor: () => void;
}

interface StatProps {
  label: string;
  value: ReactNode;
  caption: string;
  valueClass: string;
}

const Stat: FC<StatProps> = memo(({ label, value, caption, valueClass }) => (
  <div>
    <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
      {label}
    </span>
    <p className={`text-2xl font-extrabold ${valueClass}`}>{value}</p>
    <p className="text-[11px] text-stone-600 dark:text-stone-400">{caption}</p>
  </div>
));
Stat.displayName = 'Stat';

/** Header card: title, primary actions, pipeline counters and the sub-view switcher. */
export const VendorsSummary: FC<VendorsSummaryProps> = memo((props) => {
  const tabs = [
    { id: 'checklist', label: `1. Sourcing Checklist (${props.categoryCount})` },
    { id: 'comparison', label: `2. Quote Comparison Matrix (${props.quoteCount})` },
    { id: 'tastings', label: `3. Tasting & Trial Visits (${props.meetingCount})` },
    { id: 'booked', label: `4. Booked Contracts & Payments (${props.vendorCount})` },
  ] as const;

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
            <Icon name="store" className="w-5 h-5 text-brand-700 dark:text-brand-400" />
            Vendor & Sourcing Management (<span lang="hi">सप्लायर प्रबंधन</span>)
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Track supplier outreach, compare competing WhatsApp quotations side-by-side, audit
            contractual terms, log food tasting & trial visits, and schedule installment payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={props.onLogTasting} className="btn-secondary text-xs">
            <Icon name="check" className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Log Tasting / Trial Visit
          </button>
          <button type="button" onClick={props.onAnalyzeQuote} className="btn-primary text-xs">
            <Icon name="sparkle" className="w-4 h-4" />
            Analyze Vendor Quote (AI)
          </button>
          <button type="button" onClick={props.onAddVendor} className="btn-secondary text-xs">
            <Icon name="plus" className="w-4 h-4" />
            Add Vendor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-stone-100 dark:border-stone-800">
        <Stat
          label="Confirmed"
          value={`${props.bookedCount} / ${props.categoryCount}`}
          caption="Categories locked"
          valueClass="text-emerald-700 dark:text-emerald-400"
        />
        <Stat
          label="Outreach"
          value={props.contactedCount}
          caption="Vendors contacted"
          valueClass="text-stone-700 dark:text-stone-300"
        />
        <Stat
          label="Tasting & Trials"
          value={props.meetingCount}
          caption="In-person trials logged"
          valueClass="text-indigo-600 dark:text-indigo-400"
        />
        <Stat
          label="Quotations"
          value={props.quoteCount}
          caption="Quotes in comparison matrix"
          valueClass="text-brand-700 dark:text-brand-400"
        />
      </div>

      <SegmentedTabs tabs={tabs} active={props.subView} onChange={props.onSubViewChange} />
    </section>
  );
});
VendorsSummary.displayName = 'VendorsSummary';
