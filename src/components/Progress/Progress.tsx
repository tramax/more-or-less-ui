import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { Spinner } from '../Spinner';
import sizes from '../_shared/Size.module.css';
import styles from './Progress.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const PROGRESS_DEFAULTS = {
  size: 'normal',
} as const;

// The track and fill colors, the pill shape and the bar's thickness are not props: Progress.module.css
// and the --color-progress-* tokens fix them.
const SCALE_SPEC = {
  // Empty on purpose: without it `resolveScaleProps` can't tell the other props from scale props
  direct: [],
  // `size` sets font-size only: the bar's thickness and the circle's diameter are in em (see
  // Progress.module.css), so they follow it, escape-hatch values included. Its classes are
  // _shared/Size.module.css, since `size` is the only scale prop.
  compound: { size: ['fontSize'] },
  defaults: PROGRESS_DEFAULTS,
} as const;

type ProgressBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'> & {
  size?: ScaleProp;
  /** A bar that fills its container's width, or a ring the size of an Avatar. */
  shape?: 'bar' | 'circle';
  /**
   * How far along, from 0 to `max`; a value outside that is held to it. Leave it out when the length
   * of the wait is not known: the bar slides and the circle turns, and a screen reader hears a
   * progress bar with no value.
   */
  value?: number;
  /** What `value` counts up to: 100 for a percentage, the file's size for bytes. */
  max?: number;
};

/**
 * A progress bar says nothing about what it measures, so it must be named, as an icon-only Button is.
 * Add `aria-valuetext` for a value in words ("3 of 12 files").
 */
export type ProgressProps = ProgressBaseProps &
  ({ 'aria-label': string } | { 'aria-labelledby': string });

/**
 * How far a task has got: a bar or a ring, filled to `value` of `max`, or moving without a value while
 * the length of the wait is unknown. For a wait with no end in sight and no room for a bar, use Spinner.
 *
 * It is a `progressbar` for assistive tech, with `aria-valuenow` while the value is known. It is not
 * a live region: a screen reader reads the value when the user reaches it, so announce milestones
 * ("Upload complete") some other way.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { shape = 'bar', value, max, className, style, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(sizes, SCALE_SPEC, props);

  const upper = max !== undefined && max > 0 ? max : 100;
  const isIndeterminate = value === undefined || !Number.isFinite(value);
  const current = isIndeterminate ? undefined : Math.min(Math.max(value, 0), upper);
  // The CSS draws both shapes from this one number, 0-100, so a bar and a ring agree on how full they are
  const rootStyle = {
    ...scaleStyle,
    ...(current !== undefined && { '--progress-value': (current / upper) * 100 }),
    ...style,
  } as CSSProperties;

  return (
    <div
      {...rest}
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={upper}
      aria-valuenow={current}
      className={clsx(
        shape === 'circle' ? styles.circle : styles.bar,
        isIndeterminate && styles.indeterminate,
        classNames,
        className,
      )}
      style={rootStyle}
    >
      {shape === 'bar' ? (
        <div className={styles.fill} />
      ) : isIndeterminate ? (
        // The same ring that Button and Select show; the root already carries the semantics
        <Spinner className={styles.spinner} />
      ) : (
        <svg className={styles.svg} viewBox="0 0 32 32" aria-hidden="true">
          <circle className={styles.ring} cx="16" cy="16" r="14" />
          {/* pathLength makes the dash lengths percentages; the rotation starts the arc at 12 o'clock */}
          <circle
            className={styles.arc}
            cx="16"
            cy="16"
            r="14"
            pathLength="100"
            transform="rotate(-90 16 16)"
          />
        </svg>
      )}
    </div>
  );
});
