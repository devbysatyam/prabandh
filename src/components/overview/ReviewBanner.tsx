import { memo, type FC } from 'react';
import type { PlanReview } from '../../schemas';
import { Icon } from '../Icon';

interface ReviewBannerProps {
  review: PlanReview | null;
  isReviewing: boolean;
  onRunReview: () => void;
}

/** Plan health banner with the "Review Plan with AI" action and recommended steps. */
export const ReviewBanner: FC<ReviewBannerProps> = memo(({ review, isReviewing, onRunReview }) => (
  <section className="card bg-gradient-to-r from-stone-900 to-stone-800 text-white dark:from-stone-900 dark:to-stone-950 p-6 border-none shadow-md">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="max-w-xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-2">
          <Icon name="sparkle" className="w-3.5 h-3.5" />
          Intelligent Plan Review
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white">
          {review
            ? `Plan Health Score: ${review.healthScore}/100`
            : 'Run an Automated Readiness & Risk Analysis'}
        </h3>
        <p className="text-stone-300 text-xs sm:text-sm mt-1">
          {review
            ? review.summary
            : 'Analyzes your budget gaps, overdue dependency chains, and unconfirmed vendor categories into concrete next steps.'}
        </p>
      </div>

      <button
        type="button"
        onClick={onRunReview}
        disabled={isReviewing}
        className="btn-primary bg-brand-700 hover:bg-brand-800 border-none text-white font-semibold"
      >
        {isReviewing ? (
          <>
            <span
              aria-hidden="true"
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            />
            Analyzing Facts...
          </>
        ) : (
          <>
            <Icon name="sparkle" className="w-4 h-4" />
            {review ? 'Re-Analyze Plan' : 'Review Plan with AI'}
          </>
        )}
      </button>
    </div>

    {review?.recommendedActions && (
      <div className="mt-5 pt-5 border-t border-stone-700/80 grid grid-cols-1 md:grid-cols-3 gap-3">
        {review.recommendedActions.map((action, i) => (
          <div
            key={action.title}
            className="rounded-xl bg-stone-800/80 p-3.5 border border-stone-700/50"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
              Priority Action {i + 1}
            </span>
            <p className="font-semibold text-sm mt-1 text-white">{action.title}</p>
            <p className="text-xs text-stone-300 mt-1">{action.description}</p>
          </div>
        ))}
      </div>
    )}
  </section>
));
ReviewBanner.displayName = 'ReviewBanner';
