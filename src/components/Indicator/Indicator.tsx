import { forwardRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import sizes from '../_shared/Size.module.css';
import styles from './Indicator.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const INDICATOR_DEFAULTS = {
  size: 'normal',
} as const;

const SCALE_SPEC = {
  // Empty on purpose: without it `resolveScaleProps` can't tell the other props from scale props
  direct: [],
  // `size` sets the mark's font-size only: the dot's diameter and the count's height are in em (see
  // Indicator.module.css), so they follow it, escape-hatch values included. Its classes are
  // _shared/Size.module.css, since `size` is the only scale prop. It goes on the mark, not the root,
  // so a larger `size` doesn't enlarge the text of what is wrapped.
  compound: { size: ['fontSize'] },
  defaults: INDICATOR_DEFAULTS,
} as const;

export type IndicatorPlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

export type IndicatorProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'children'> & {
  /** What the mark is pinned to: an Avatar, a Button, an icon. */
  children: ReactNode;
  /**
   * A number to show. Left out, the mark is a plain dot. `0` shows nothing (nothing to count) unless
   * `isZeroShown`. A number above `max` shows as `max+`.
   */
  count?: number;
  /** The largest number shown whole; above it the mark reads "99+". Default 99. */
  max?: number;
  /** Show the mark for a `count` of 0. */
  isZeroShown?: boolean;
  /** Hide the mark (a dot has no 0 to hide itself at). The wrapped content stays mounted. */
  isHidden?: boolean;
  /** Which corner of the wrapped content. Logical: "end" is the right in left-to-right text. Default `top-end`. */
  placement?: IndicatorPlacement;
  /**
   * The shape of what is wrapped. A `circle` (an Avatar) has its corner inside the bounding box, so the
   * mark sits closer in, on the rim, instead of floating off in the air. Default `rectangle`.
   */
  overlap?: 'rectangle' | 'circle';
  /** The mark's size: `less` / `normal` / `more`, or a CSS length. */
  size?: ScaleProp;
  /**
   * What the mark says to assistive tech ("3 unread messages", "Online"). Without it the mark is
   * decorative and hidden from them, so a dot says nothing: name it, or say it where the wrapped
   * content is named.
   */
  label?: string;
};

const DEFAULT_MAX = 99;

/**
 * A dot or a count pinned to a corner of what it wraps: an unread "3", an online dot. The mark is the
 * brand color, not red: it says "something is here", not "something is wrong", and it must not hurry
 * anyone. It gets noticed by being a mark on the corner and by arriving with a pop, not by alarm; it
 * leaves by shrinking away, and unmounts when that ends.
 *
 * It is decorative until named, as Spinner is: pass `label` and it is announced as an image with that
 * name. It is not a live region; announce a change some other way.
 */
export const Indicator = forwardRef<HTMLSpanElement, IndicatorProps>(function Indicator(
  {
    children,
    count,
    max,
    isZeroShown = false,
    isHidden = false,
    placement = 'top-end',
    overlap = 'rectangle',
    label,
    className,
    style,
    ...props
  },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(sizes, SCALE_SPEC, props);

  const isCount = count !== undefined && Number.isFinite(count);
  const isEmpty = isCount && count <= 0 && !isZeroShown;
  const isShown = !isHidden && !isEmpty;
  const upper = max !== undefined && max > 0 ? max : DEFAULT_MAX;
  const text = isCount ? (count > upper ? `${upper}+` : String(Math.max(count, 0))) : undefined;

  // What is drawn, kept after the mark is told to go: it shrinks away showing what it last showed (a
  // "3" that became 0 doesn't turn into a "0" or an empty dot on the way out), and unmounts when the
  // animation ends. Replaced while rendering (React re-renders at once, before anything is drawn), so
  // no frame shows the old content.
  const [drawn, setDrawn] = useState<{ text: string | undefined } | null>(
    isShown ? { text } : null,
  );
  if (isShown && (drawn === null || drawn.text !== text)) setDrawn({ text });
  const isLeaving = !isShown && drawn !== null;

  return (
    <span
      {...rest}
      ref={ref}
      className={clsx(styles.indicator, overlap === 'circle' && styles.circle, className)}
      style={style}
    >
      {children}
      {drawn !== null && (
        // A zero-size anchor on the corner, with the mark centered on it: no transform, so the corner
        // is a logical inset and mirrors right-to-left, and the mark's width needs no knowing.
        // A leaving mark is already gone as far as assistive tech is concerned.
        <span
          role={label && !isLeaving ? 'img' : undefined}
          aria-label={isLeaving ? undefined : label}
          aria-hidden={label && !isLeaving ? undefined : true}
          className={clsx(styles.anchor, styles[placementClass(placement)])}
        >
          <span
            className={clsx(
              styles.mark,
              drawn.text === undefined ? styles.dot : styles.count,
              isLeaving && styles.leaving,
              classNames,
            )}
            style={scaleStyle}
            // Only the leave animation ends the mark; the pop's end, which also arrives here, doesn't
            onAnimationEnd={() => {
              if (isLeaving) setDrawn(null);
            }}
          >
            {drawn.text !== undefined && <span className={styles.text}>{drawn.text}</span>}
          </span>
        </span>
      )}
    </span>
  );
});

// 'top-end' → styles.topEnd
const placementClass = (placement: IndicatorPlacement) =>
  placement.replace(/-(\w)/, (_, c: string) => c.toUpperCase());
