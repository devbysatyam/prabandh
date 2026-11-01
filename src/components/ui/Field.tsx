import type { FC, ReactNode } from 'react';

/** Shared Tailwind classes for form labels. */
export const LABEL_CLASS = 'block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1';

/** Shared Tailwind classes for the small inline "Cancel"/"Close" text buttons. */
export const TEXT_BUTTON_CLASS =
  'text-xs text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline min-h-[28px] px-2 rounded';

interface FieldProps {
  /** id of the control this label describes (must match the child control's id). */
  htmlFor: string;
  label: ReactNode;
  className?: string | undefined;
  children: ReactNode;
}

/** A labelled form control wrapper: `<label htmlFor>` + the control passed as children. */
export const Field: FC<FieldProps> = ({ htmlFor, label, className, children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className={LABEL_CLASS}>
      {label}
    </label>
    {children}
  </div>
);

interface SegmentedTabsProps<T extends string> {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}

/** Pill-style segmented switcher used for sub-views inside a tab. */
export function SegmentedTabs<T extends string>({ tabs, active, onChange }: SegmentedTabsProps<T>) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            active === tab.id
              ? 'bg-white dark:bg-stone-900 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
