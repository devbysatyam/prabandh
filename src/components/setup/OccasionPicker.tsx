import { memo, type FC } from 'react';
import type { Occasion } from '../../schemas';
import { OCCASION_CHOICES } from './constants';

interface OccasionPickerProps {
  value: Occasion;
  onChange: (occasion: Occasion) => void;
}

/** Occasion type toggle-button group. */
export const OccasionPicker: FC<OccasionPickerProps> = memo(({ value, onChange }) => (
  <div>
    <p
      id="occasion-group-label"
      className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2"
    >
      1. Select Occasion Type
    </p>
    <div
      role="group"
      aria-labelledby="occasion-group-label"
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {OCCASION_CHOICES.map((item) => {
        const isSelected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={isSelected}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              isSelected
                ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-900/40'
            }`}
          >
            <span className="text-2xl mb-1" aria-hidden="true">
              {item.icon}
            </span>
            <div>
              <p
                className={`font-bold text-sm ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-stone-900 dark:text-stone-100'}`}
              >
                {item.label}
              </p>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">{item.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
));
OccasionPicker.displayName = 'OccasionPicker';
