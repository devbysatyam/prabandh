import { memo } from 'react';
import { CATEGORIES, type Category, type Plan } from '../../schemas';
import { categoryLabel } from './helpers';

interface CategorySelectProps {
  id: string;
  ariaLabel: string;
  value: Category;
  occasion: Plan['occasion'];
  onChange: (category: Category) => void;
  className?: string;
}

const SELECTABLE = CATEGORIES.filter((c) => c !== 'contingency');

/** Category dropdown (contingency excluded) with occasion-specific labels. */
export const CategorySelect = memo(function CategorySelect({
  id,
  ariaLabel,
  value,
  occasion,
  onChange,
  className = 'input-base text-xs',
}: CategorySelectProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value as Category)}
      className={className}
    >
      {SELECTABLE.map((cat) => (
        <option key={cat} value={cat}>
          {categoryLabel(occasion, cat)}
        </option>
      ))}
    </select>
  );
});
