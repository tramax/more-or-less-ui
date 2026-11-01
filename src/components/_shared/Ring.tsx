import type { ReactNode, SVGProps } from 'react';
import { clsx } from '@/utils/clsx';
import styles from './Ring.module.css';

/**
 * The drawing of a ring, for Spinner (an arc) and Progress (a track and an arc): a 32-unit square with
 * a circle of radius 14 stroked 4 wide, so the stroke is an eighth of the width and its outer edge is
 * on the box. `RingCircle` sets `pathLength` to 100, so a dash length is a percentage of the circle.
 * Decorative: whoever draws it carries the meaning.
 */
export function Ring({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** One circle of a `Ring`. The caller's class sets the stroke color and the dashes. */
export function RingCircle({ className, ...props }: SVGProps<SVGCircleElement>) {
  return (
    <circle
      {...props}
      className={clsx(styles.circle, className)}
      cx="16"
      cy="16"
      r="14"
      pathLength="100"
    />
  );
}
