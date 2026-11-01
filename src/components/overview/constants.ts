import type { TabId } from '../Navigation';

/** Starter prompts offered before the first copilot question. */
export const SUGGESTED_QUESTIONS = [
  'Are we over budget right now?',
  'What should I book or complete next?',
  'What is the current RSVP breakdown?',
  'How do I politely negotiate with the caterer?',
] as const;

/** Shown when the copilot request fails. */
export const COPILOT_ERROR_TEXT =
  'Sorry, I had trouble answering that right now. Please try again.';

/** Static description of a section shortcut card (dynamic subtitle is computed by the card list). */
export interface SectionShortcut {
  tab: TabId;
  emoji: string;
  title: string;
  /** Highlights the card with the brand palette. */
  featured?: boolean;
}

/** Order and copy of the "Direct Section Explorer" shortcut cards. */
export const SECTION_SHORTCUTS: readonly SectionShortcut[] = [
  { tab: 'venues', emoji: '🏛️', title: 'Venues & Recce' },
  { tab: 'vendors', emoji: '🤝', title: 'Vendors & Tastings' },
  { tab: 'budget', emoji: '💰', title: 'Budget Allocation' },
  { tab: 'guests', emoji: '👥', title: 'Guest List & RSVP' },
  { tab: 'timeline', emoji: '📅', title: 'Milestone Timeline' },
  { tab: 'runsheet', emoji: '⏱️', title: 'Day-of Runsheet' },
  { tab: 'ideas', emoji: '🎨', title: 'AI Creative Themes' },
  { tab: 'analytics', emoji: '📊', title: 'Analytics & Readiness', featured: true },
  { tab: 'setup', emoji: '⚙️', title: 'Vision & Priorities' },
];

/** Severity dot classes keyed by insight severity. */
export const SEVERITY_DOT_CLASS = {
  critical: 'bg-red-500 ring-red-100 dark:ring-red-950/60',
  warning: 'bg-amber-500 ring-amber-100 dark:ring-amber-950/60',
  suggestion: 'bg-brand-500 ring-brand-100 dark:ring-brand-950/60',
} as const;

/** Badge classes keyed by insight severity. */
export const SEVERITY_BADGE_CLASS = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  suggestion: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300',
} as const;
