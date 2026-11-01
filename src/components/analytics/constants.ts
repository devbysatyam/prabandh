/** Tailwind classes per readiness tier. */
export const TIER_COLORS = {
  excellent:
    'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
  on_track:
    'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800',
  needs_attention:
    'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
  critical: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800',
};

/** Bilingual readiness label per tier. */
export const TIER_LABELS = {
  excellent: 'Excellent Readiness (उत्कृष्ट तैयारी)',
  on_track: 'On Track (योजना अनुसार)',
  needs_attention: 'Needs Attention (ध्यान देने योग्य)',
  critical: 'Action Required (तुरंत कार्रवाई)',
};
