import type { FC, SVGProps } from 'react';
import { ICON_SHAPES, type IconName } from './icons/shapes';

export type { IconName } from './icons/shapes';

/** Icons drawn as filled glyphs rather than 2px strokes. */
const FILLED_ICONS: ReadonlySet<IconName> = new Set<IconName>(['whatsapp']);

/** Decorative inline SVG icon (hidden from assistive tech); size it via `className`. */
export const Icon: FC<SVGProps<SVGSVGElement> & { name: IconName }> = ({
  name,
  className = 'w-5 h-5',
  ...props
}) => {
  const filled = FILLED_ICONS.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? undefined : 'currentColor'}
      strokeWidth={filled ? undefined : '2'}
      strokeLinecap={filled ? undefined : 'round'}
      strokeLinejoin={filled ? undefined : 'round'}
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {ICON_SHAPES[name]}
    </svg>
  );
};
