import { memo, type FC } from 'react';
import { Icon } from '../Icon';
import { PRESET_EXAMPLES } from './constants';

interface IntakeCardProps {
  description: string;
  isParsing: boolean;
  parseError: string | null;
  parseSuccess: string | null;
  onDescriptionChange: (value: string) => void;
  onParse: () => void;
  onDismissSuccess: () => void;
}

/** Free-text AI intake card: textarea, quick presets, status messages and the parse button. */
export const IntakeCard: FC<IntakeCardProps> = memo(
  ({
    description,
    isParsing,
    parseError,
    parseSuccess,
    onDescriptionChange,
    onParse,
    onDismissSuccess,
  }) => (
    <section className="card mb-8 border-brand-200 dark:border-brand-900/60 shadow-lg shadow-brand-500/5 bg-gradient-to-b from-brand-50/30 to-white dark:from-brand-950/20 dark:to-stone-900">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="sparkle" className="w-5 h-5 text-brand-700 dark:text-brand-400" />
        <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
          Natural Language Event Intake
        </h3>
      </div>
      <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
        Type or paste anything: budget (e.g. &quot;15 lakh&quot; or &quot;₹15,00,000&quot;), guest
        count, dates, city, and what matters most.
      </p>
      <textarea
        id="nlp-event-intake-textarea"
        aria-label="Natural Language Event Description Intake"
        rows={3}
        autoComplete="off"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="e.g. Shaadi in Pune, 200 guests, 15 lakh budget, mid-December. We want royal catering and cinematic photography."
        className="input-base text-sm resize-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Quick ideas:</span>
        {PRESET_EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => onDescriptionChange(ex.text)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-brand-100 dark:hover:bg-brand-950 hover:text-brand-800 dark:hover:text-brand-200 transition"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {parseError && (
          <p role="alert" className="text-xs text-amber-700 dark:text-amber-400">
            {parseError}
          </p>
        )}
        {parseSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <span role="status">{parseSuccess}</span>
            <button
              type="button"
              onClick={onDismissSuccess}
              aria-label="Dismiss message"
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 ml-2 min-w-[24px] min-h-[24px]"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onParse}
            disabled={isParsing || !description.trim()}
            aria-busy={isParsing}
            className="btn-primary"
          >
            {isParsing ? (
              <>
                <span
                  aria-hidden="true"
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                />
                Parsing Vision with Gemini...
              </>
            ) : (
              <>
                <Icon name="sparkle" className="w-4 h-4" />
                Fill Form From Description
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  ),
);
IntakeCard.displayName = 'IntakeCard';
