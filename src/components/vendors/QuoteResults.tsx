import type { FC, ReactNode } from 'react';
import type { Plan, Quote } from '../../schemas';
import { compareQuoteToBudget, generateVendorInquiry } from '../../engine/vendors';
import { formatINR } from '../../engine/money';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Icon } from '../Icon';

interface QuoteResultsProps {
  plan: Plan;
  quote: Quote;
  onSaveForComparison: () => void;
  onLockIn: (quote: Quote) => void;
}

const CARD_CLASS =
  'p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800';

/** Text for the GST status of a quote. */
function gstText(taxIncluded: boolean | null): string {
  if (taxIncluded === true) return 'Included';
  if (taxIncluded === false) return 'Extra (+18%)';
  return 'Not stated';
}

const MetricCard: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <div className={CARD_CLASS}>
    <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-400 uppercase">
      {title}
    </span>
    {children}
  </div>
);

/** Analysis output for an extracted quote: key metrics, risk flags and follow-up actions. */
export const QuoteResults: FC<QuoteResultsProps> = ({
  plan,
  quote,
  onSaveForComparison,
  onLockIn,
}) => {
  const { copiedKey, copy } = useCopyToClipboard();
  const comparison = compareQuoteToBudget(quote, plan.allocation[quote.category], plan.guests);

  const copyInquiry = () =>
    copy(
      generateVendorInquiry(
        quote.vendorName ?? 'Vendor',
        quote.category,
        quote,
        plan.guests,
        plan.eventDate,
      ),
    );

  return (
    <div className="mt-4 pt-4 border-t border-brand-200 dark:border-brand-900/60 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard title="Effective Total Cost">
          <p className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {formatINR(comparison.effectiveCost)}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Category budget: {formatINR(comparison.categoryBudget)}
          </p>
        </MetricCard>

        <MetricCard title="Rate Details">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {quote.pricePerPlate ? `${formatINR(quote.pricePerPlate)}/plate` : 'Lump Sum'}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Min guarantee: {quote.guestMinimum ?? 'None'} · Advance:{' '}
            {quote.advancePercent ?? 'Unstated'}%
          </p>
        </MetricCard>

        <MetricCard title="Taxes & Cancellation">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            GST: {gstText(quote.taxIncluded)}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
            {quote.cancellationPolicy ?? 'No cancellation terms stated'}
          </p>
        </MetricCard>
      </div>

      {comparison.flags.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Contractual Check & Risk Flags
          </h5>
          <div className="space-y-1.5">
            {comparison.flags.map((f, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  f.type === 'warn'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                }`}
              >
                <Icon name={f.type === 'warn' ? 'alert' : 'check'} className="w-4 h-4 shrink-0" />
                <span>{f.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
        <button type="button" onClick={copyInquiry} className="btn-secondary text-xs">
          <Icon name="whatsapp" className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          {copiedKey ? 'Negotiation Message Copied!' : 'Copy WhatsApp Negotiation Message'}
        </button>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onSaveForComparison} className="btn-secondary text-xs">
            Save for Comparison Matrix
          </button>
          <button type="button" onClick={() => onLockIn(quote)} className="btn-primary text-xs">
            <Icon name="check" className="w-4 h-4" />
            Lock In Vendor & Setup Payment Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
