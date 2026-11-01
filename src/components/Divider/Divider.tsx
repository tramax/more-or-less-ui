import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import styles from './Divider.module.css';

export type DividerProps = Omit<HTMLAttributes<HTMLHRElement>, 'children' | 'color'> & {
  /** `horizontal` runs across (default); `vertical` runs up and down, between items in a row. */
  orientation?: 'horizontal' | 'vertical';
};

/**
 * A hairline between two groups of content. It has no margin, as Card has none: the space on either
 * side comes from the layout it sits in (a Stack's `gap`, or a wrapping Box). In a Stack it stretches
 * across the Stack, whatever its `align`.
 */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { orientation = 'horizontal', className, ...props },
  ref,
) {
  return (
    <hr
      {...props}
      ref={ref}
      // An hr is a horizontal separator already; only the vertical one needs saying
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      className={clsx(styles.divider, styles[orientation], className)}
    />
  );
});
