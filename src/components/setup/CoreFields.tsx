import { memo, type FC } from 'react';
import { formatINR, parseINR } from '../../engine/money';
import { MAX_GUESTS_INPUT, MIN_GUESTS } from './constants';
import { estimatePerPlate, type SetupFormValues } from './helpers';

interface CoreFieldsProps {
  values: SetupFormValues;
  today: string;
  onChange: <K extends keyof SetupFormValues>(key: K, value: SetupFormValues[K]) => void;
}

const FIELD_LABEL = 'text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300';

/** Budget, headcount, date, city and vibe inputs. */
export const CoreFields: FC<CoreFieldsProps> = memo(({ values, today, onChange }) => {
  const { budgetString, guests, eventDate, city, vibe } = values;
  const currentParsedBudget = parseINR(budgetString) ?? 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="budget-input" className={FIELD_LABEL}>
              Total Budget (INR ₹)
            </label>
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-400">
              {formatINR(currentParsedBudget)}
            </span>
          </div>
          <input
            id="budget-input"
            type="text"
            value={budgetString}
            onChange={(e) => onChange('budgetString', e.target.value)}
            placeholder="e.g. 15 lakh, 8L, 2000000"
            autoComplete="off"
            aria-invalid={budgetString.trim() !== '' && parseINR(budgetString) === null}
            aria-describedby="budget-input-hint"
            className="input-base"
            required
          />
          <p id="budget-input-hint" className="text-[11px] text-stone-600 dark:text-stone-400 mt-1">
            Supports &quot;15 lakh&quot;, &quot;8.5L&quot;, &quot;2 crore&quot;, or exact numbers.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="guests-input" className={FIELD_LABEL}>
              Target Guest Headcount
            </label>
            <span className="text-xs text-stone-600 dark:text-stone-400">
              ~{formatINR(estimatePerPlate(currentParsedBudget, guests))}
              /plate
            </span>
          </div>
          <input
            id="guests-input"
            type="number"
            min={MIN_GUESTS}
            max={MAX_GUESTS_INPUT}
            autoComplete="off"
            inputMode="numeric"
            value={guests}
            onChange={(e) => onChange('guests', parseInt(e.target.value || String(MIN_GUESTS), 10))}
            className="input-base"
            required
          />
          <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1">
            Directly drives catering allocations and vendor minimum guarantees.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date-input" className={`block ${FIELD_LABEL} mb-1.5`}>
            Celebration Date
          </label>
          <input
            id="date-input"
            type="date"
            min={today}
            value={eventDate}
            onChange={(e) => onChange('eventDate', e.target.value)}
            className="input-base"
            required
          />
        </div>

        <div>
          <label htmlFor="city-input" className={`block ${FIELD_LABEL} mb-1.5`}>
            City / Destination
          </label>
          <input
            id="city-input"
            type="text"
            value={city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="e.g. Pune, Jaipur, Delhi, Mumbai"
            autoComplete="address-level2"
            className="input-base"
          />
        </div>
      </div>

      <div>
        <label htmlFor="vibe-input" className={`block ${FIELD_LABEL} mb-1.5`}>
          Celebration Mood & Style
        </label>
        <input
          id="vibe-input"
          type="text"
          value={vibe}
          onChange={(e) => onChange('vibe', e.target.value)}
          placeholder="e.g. Royal traditional, rustic outdoor garden, high energy Bollywood"
          className="input-base"
        />
      </div>
    </>
  );
});
CoreFields.displayName = 'CoreFields';
