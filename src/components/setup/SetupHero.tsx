import { memo, type FC } from 'react';
import type { Plan } from '../../schemas';
import { Icon } from '../Icon';
import { LangText } from '../LangText';

interface SetupHeroProps {
  plan?: Plan | null | undefined;
  onLoadSample?: (() => void) | undefined;
}

/** Banner shown while editing an existing plan. */
export const EditingBanner: FC<{ title: string }> = memo(({ title }) => (
  <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-3 shadow-sm">
    <div className="flex items-center gap-2.5">
      <span className="text-xl" aria-hidden="true">
        ✏️
      </span>
      <div>
        <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
          Editing Live Plan: {title}
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Updating your vision re-tunes budget allocations and catering formulas without losing your
          custom guest list or vendors.
        </p>
      </div>
    </div>
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
      Live Connected Mode
    </span>
  </div>
));
EditingBanner.displayName = 'EditingBanner';

/** Page heading, tagline and the optional "load sample" call to action. */
export const SetupHero: FC<SetupHeroProps> = memo(({ plan, onLoadSample }) => (
  <div className="text-center mb-8">
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-3">
      <LangText
        text={
          plan
            ? 'Prabandh · प्रबंध · Section 1: Event Vision & Parameters'
            : 'Prabandh · प्रबंध · Step 1: Define Your Event'
        }
      />
    </span>
    <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">
      Plan the Celebration, Not the Spreadsheet
    </h2>
    <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
      Describe your vision in plain English or Hinglish. Prabandh&apos;s connected engine builds
      your complete budget, venue fit, timeline, vendor checklist, and run sheet in under a second.
    </p>

    {!plan && onLoadSample && (
      <div className="mt-4">
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/80 dark:hover:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-sm transition hover:scale-102"
        >
          <Icon name="sparkle" className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span>
            Explore Interactive Sample Celebration (<span lang="hi">डेमो शादी देखें</span>)
          </span>
          <span className="text-[11px] opacity-75">→ Instant 9-Section Tour</span>
        </button>
      </div>
    )}
  </div>
));
SetupHero.displayName = 'SetupHero';
