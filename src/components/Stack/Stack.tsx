import { forwardRef } from 'react';
import { Box, type BoxProps } from '@/components/Box';
import { clsx } from '@/utils/clsx';
import { GAP_DEFAULTS, resolveGap } from '@/components/_shared/Gap';
import type { ScaleProp } from '@/types/scale';
import styles from './Stack.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const STACK_DEFAULTS = {
  ...GAP_DEFAULTS,
  direction: 'column',
} as const;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type StackProps = BoxProps & {
  /** Space between the children. */
  gap?: ScaleProp;
  /** `column` stacks the children vertically (default), `row` lays them out side by side. */
  direction?: 'column' | 'row';
  /** Where the children sit on the cross axis (across a column, up and down a row). */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** How the children share the main axis (down a column, along a row). */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Let the children flow onto a new line when they don't fit. */
  wrap?: boolean;
};

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { className, style, direction = STACK_DEFAULTS.direction, align, justify, wrap, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveGap(props);

  return (
    <Box
      {...rest}
      ref={ref}
      className={clsx(
        styles.stack,
        styles[direction],
        align && styles[`align${capitalize(align)}`],
        justify && styles[`justify${capitalize(justify)}`],
        wrap && styles.wrap,
        classNames,
        className,
      )}
      style={{ ...scaleStyle, ...style }}
    />
  );
});
