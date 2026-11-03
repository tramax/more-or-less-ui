import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { CloseButton } from '../_shared/CloseButton';
import styles from './Banner.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const BANNER_DEFAULTS = {
  size: 'normal',
  background: 'normal',
} as const;

const SCALE_SPEC = {
  // Each drives the CSS property of the same name
  direct: ['background'],
  // `size` sets font-size only: the padding and the gaps are in em (see Banner.module.css), so they
  // follow it, escape-hatch values included.
  compound: { size: ['fontSize'] },
  defaults: BANNER_DEFAULTS,
} as const;

export type BannerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  // `title` is the headline here, not the native tooltip
  'color' | 'title'
> & {
  size?: ScaleProp;
  /**
   * How loudly it speaks: a faint brand tint (`less`), an opaque one (`normal`), the brand color
   * itself (`more`). It is not a kind of message (info, error, ...); say that in the words.
   */
  background?: ScaleProp;
  /** A short headline above the message, in heavier type. */
  title?: string;
  /**
   * Shows a dismiss button (a ×) and calls this when it is pressed. The banner doesn't hide itself:
   * the caller stops rendering it, and decides whether it comes back.
   */
  onDismiss?: () => void;
};

const isEmpty = (node: unknown) => node == null || typeof node === 'boolean' || node === '';

/**
 * An announcement in the flow of the page: a block of brand color with a message, and optionally a
 * headline and a dismiss button. Put it where it concerns; it does not float or time out. It is a
 * polite live region (`role="status"`), so one rendered after the page has loaded is announced
 * without taking focus; pass `role="alert"` for something urgent.
 */
export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner(
  { role = 'status', title, onDismiss, className, style, children, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(styles, SCALE_SPEC, props);

  return (
    <div
      {...rest}
      ref={ref}
      role={role}
      className={clsx(styles.banner, classNames, className)}
      style={{ ...scaleStyle, ...style }}
    >
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        {!isEmpty(children) && <div className={styles.message}>{children}</div>}
      </div>
      {onDismiss && <CloseButton className={styles.dismiss} label="Dismiss" onClick={onDismiss} />}
    </div>
  );
});
