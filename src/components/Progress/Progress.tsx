import { forwardRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { Ring, RingCircle } from '../_shared/Ring';
import sizes from '../_shared/Size.module.css';
import { Spinner } from '../Spinner';
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

// How long a move to a new value takes: a nudge settles quickly, a jump across the bar is followed by
// the eye. Linear in the distance, between a floor and a ceiling.
const MIN_MS = 180;
const MS_PER_PERCENT = 6;
const MAX_MS = 780;
const DEFAULT_MS = 300;
const durationFor = (distance: number) =>
  Math.min(Math.round(MIN_MS + distance * MS_PER_PERCENT), MAX_MS);

/** Where the fill is (0-100, or none while indeterminate) and how the last move to it was timed. */
type Motion = { percent: number | undefined; duration: number; isFinished: boolean };

/**
 * How far a task has got: a bar or a ring, filled to `value` of `max`, or moving without a value while
 * the length of the wait is unknown. For a wait with no end in sight and no room for a bar, use Spinner.
 *
 * It is a `progressbar` for assistive tech, with `aria-valuenow` while the value is known. It is not
 * a live region: a screen reader reads the value when the user reaches it, so announce milestones
 * ("Upload complete") some other way.
 *
 * It moves to a new value over a time that grows with the distance, and plays a short flourish when the
 * value arrives at `max` from below (not when it is already full on first render).
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { shape = 'bar', value, max, className, style, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(sizes, SCALE_SPEC, props);

  const upper = max !== undefined && max > 0 ? max : 100;
  const isIndeterminate = value === undefined || !Number.isFinite(value);
  const current = isIndeterminate ? undefined : Math.min(Math.max(value, 0), upper);
  const percent = current === undefined ? undefined : (current / upper) * 100;

  // The previous percent is kept in state, tagged with the move it led to, and replaced while rendering
  // (React re-renders at once, before anything is drawn), so the first frame of a move already has its
  // duration: an effect would set it a frame late.
  const [motion, setMotion] = useState<Motion>({
    percent,
    duration: DEFAULT_MS,
    isFinished: false,
  });
  if (motion.percent !== percent) {
    const distance =
      percent !== undefined && motion.percent !== undefined
        ? Math.abs(percent - motion.percent)
        : undefined;
    setMotion({
      percent,
      duration: distance === undefined ? DEFAULT_MS : durationFor(distance),
      // Arrived at the end from somewhere below it
      isFinished: distance !== undefined && percent === 100,
    });
  }

  // The CSS draws both shapes from --progress-value, so a bar and a ring agree on how full they are
  const rootStyle = {
    ...scaleStyle,
    ...(percent !== undefined && {
      '--progress-value': percent,
      '--progress-duration': `${motion.duration}ms`,
    }),
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
        motion.isFinished && styles.finished,
        classNames,
        className,
      )}
      style={rootStyle}
    >
      {shape === 'bar' ? (
        <>
          <div className={styles.fill} />
          {/* Indeterminate: a second, fainter segment that starts later, so the two overlap and part */}
          {isIndeterminate && <div className={clsx(styles.fill, styles.trail)} />}
        </>
      ) : isIndeterminate ? (
        // The same ring that Button and Select show; the root already carries the semantics
        <Spinner className={styles.spinner} />
      ) : (
        <Ring className={styles.svg}>
          <RingCircle className={styles.track} />
          {/* The rotation starts the arc at 12 o'clock */}
          <RingCircle className={styles.arc} transform="rotate(-90 16 16)" />
        </Ring>
      )}
    </div>
  );
});
