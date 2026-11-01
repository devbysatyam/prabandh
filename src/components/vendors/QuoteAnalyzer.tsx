import type { FC } from 'react';
import type { Category, Plan, Quote } from '../../schemas';
import { Icon } from '../Icon';
import { Field, TEXT_BUTTON_CLASS } from '../ui/Field';
import { CategorySelect } from './CategorySelect';
import { QuoteResults } from './QuoteResults';
import type { QuoteAnalyzerState } from './useQuoteAnalyzer';

interface QuoteAnalyzerProps {
  plan: Plan;
  category: Category;
  onCategoryChange: (category: Category) => void;
  analyzer: QuoteAnalyzerState;
  onClose: () => void;
  onSaveForComparison: () => void;
  onLockIn: (quote: Quote) => void;
}

/** Panel where a raw vendor proposal is pasted, extracted and compared to budget. */
export const QuoteAnalyzer: FC<QuoteAnalyzerProps> = ({
  plan,
  category,
  onCategoryChange,
  analyzer,
  onClose,
  onSaveForComparison,
  onLockIn,
}) => (
  <section className="card border-brand-300 dark:border-brand-900 bg-brand-50/20 dark:bg-brand-950/20 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon name="sparkle" className="w-5 h-5 text-brand-700 dark:text-brand-400" />
        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
          Vendor Quote Analyzer & Contract Verifier
        </h4>
      </div>
      <button type="button" onClick={onClose} className={TEXT_BUTTON_CLASS}>
        Close
      </button>
    </div>

    <form
      onSubmit={(e) => {
        e.preventDefault();
        void analyzer.analyze();
      }}
      className="space-y-3"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <Field htmlFor="quote-category-select" label="Category" className="w-full sm:w-48">
          <CategorySelect
            id="quote-category-select"
            ariaLabel="Quotation Category"
            value={category}
            occasion={plan.occasion}
            onChange={onCategoryChange}
          />
        </Field>

        <Field
          htmlFor="quote-raw-textarea"
          label="Paste Raw Proposal (WhatsApp message or Email draft)"
          className="flex-1"
        >
          <textarea
            id="quote-raw-textarea"
            aria-label="Raw Vendor Proposal Text"
            rows={3}
            required
            value={analyzer.rawText}
            onChange={(e) => analyzer.setRawText(e.target.value)}
            placeholder="e.g. ₹1500 per plate, minimum 250 plates, 50% advance, GST extra, includes standard buffet and welcome mocktails."
            className="input-base text-xs resize-none"
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={analyzer.isExtracting || !analyzer.rawText.trim()}
          className="btn-primary text-xs"
        >
          {analyzer.isExtracting ? 'Analyzing Terms...' : 'Extract & Compare Terms'}
        </button>
      </div>
    </form>

    {analyzer.extracted && (
      <QuoteResults
        plan={plan}
        quote={analyzer.extracted}
        onSaveForComparison={onSaveForComparison}
        onLockIn={onLockIn}
      />
    )}
  </section>
);
