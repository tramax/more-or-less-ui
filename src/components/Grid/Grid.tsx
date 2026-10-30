import { forwardRef, type CSSProperties } from 'react';
import { Box, type BoxProps } from '@/components/Box';
import { GAP_DEFAULTS, resolveGap } from '@/components/_shared/Gap';
import { clsx } from '@/utils/clsx';
import { toCssValue } from '@/utils/scale';
import styles from './Grid.module.css';
import type { ScaleProp } from '@/types/scale';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const GRID_DEFAULTS = GAP_DEFAULTS;

export type GridProps = BoxProps & {
  /** Space between the rows and columns. */
  gap?: ScaleProp;
  /**
   * Leave it out for a single column. A number is a fixed count of equal columns. `{ minWidth }` fits
   * as many equal columns as the width allows, each at least `minWidth` wide (a CSS length, a number
   * is pixels): the usual card grid. One prop for both, so they can't be set at once.
   */
  columns?: number | { minWidth: string | number };
};

// A count that is not a whole number of at least 1 would be invalid CSS, so it is made one; NaN and
// Infinity are dropped
const toCount = (n: number) => (Number.isFinite(n) ? Math.max(1, Math.floor(n)) : undefined);

export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { className, style, columns, ...props },
  ref,
) {
  const gap = resolveGap(props);

  const count = typeof columns === 'number' ? toCount(columns) : undefined;
  // An empty minWidth is no width at all
  const minWidth =
    columns && typeof columns === 'object' && columns.minWidth !== ''
      ? columns.minWidth
      : undefined;

  const columnStyle: Record<string, string | number> = {};
  if (count !== undefined) columnStyle['--grid-columns'] = count;
  if (minWidth !== undefined) columnStyle['--grid-column-min'] = toCssValue(minWidth);

  return (
    <Box
      {...gap.rest}
      ref={ref}
      className={clsx(
        styles.grid,
        count !== undefined && styles.fixed,
        minWidth !== undefined && styles.fit,
        gap.classNames,
        className,
      )}
      style={{ ...columnStyle, ...gap.style, ...style } as CSSProperties}
    />
  );
});
