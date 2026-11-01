import { memo, type FC } from 'react';
import { PRIORITY_ITEMS } from '../../schemas';

interface PrioritiesPickerProps {
  selectedKeys: readonly string[];
  onToggle: (id: string) => void;
}

/** "What matters most" priority cards (each selected one gets a +25% weight boost). */
export const PrioritiesPicker: FC<PrioritiesPickerProps> = memo(({ selectedKeys, onToggle }) => (
  <div>
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
      <div>
        <p
          id="priorities-group-label"
          className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300"
        >
          2. What Matters Most? (Priorities get +25% weight boost)
        </p>
        <p className="text-[11px] text-stone-600 dark:text-stone-400">
          Select celebration focus areas. The allocation algorithm applies a deterministic +25%
          weight multiplier to each chosen dimension.
        </p>
      </div>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
        {selectedKeys.length} selected (+25% boost active)
      </span>
    </div>

    <div
      role="group"
      aria-labelledby="priorities-group-label"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      {PRIORITY_ITEMS.map((item) => {
        const isSelected = selectedKeys.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            aria-pressed={isSelected}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between relative ${
              isSelected
                ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 ring-2 ring-brand-500/20 shadow-sm'
                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900/60'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-2xl" aria-hidden="true">
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isSelected
                    ? 'bg-brand-700 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {isSelected ? '+25% Boost' : 'Normal'}
              </span>
            </div>

            <div>
              <p
                className={`font-bold text-xs sm:text-sm ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-stone-900 dark:text-stone-100'}`}
              >
                {item.label}
              </p>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
));
PrioritiesPicker.displayName = 'PrioritiesPicker';
