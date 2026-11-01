import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import sizes from '../_shared/Size.module.css';
import styles from './Spinner.module.css';

// No defaults on purpose: a spinner is 1em, as big as the text it sits in, which is what a button or a
// field wants. Pass `size` to set it free of the surrounding text.
const SCALE_SPEC = {
  // Empty on purpose: without it `resolveScaleProps` can't tell the other props from scale props
  direct: [],
  // `size` sets font-size only: the ring is 1em square (see Spinner.module.css). Its classes are
  // _shared/Size.module.css, since `size` is the only scale prop.
  compound: { size: ['fontSize'] },
} as const;

export type SpinnerProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & {
  /** The ring's size: `less` / `normal` / `more`. Unset, it is as big as the surrounding text. */
  size?: ScaleProp;
};

/**
 * The loading ring, for work of unknown length (Progress is for work with a known one). It takes the
 * text color of where it sits.
 *
 * It is decorative until named: the component that shows it normally says what is loading, with
 * `aria-busy` or a status (as Button and Select do), and then the ring is hidden from assistive tech.
 * Standing alone, give it an `aria-label` (or `aria-labelledby`) and it is announced as a progress
 * bar with no value, which is what an indeterminate wait is.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { className, style, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(sizes, SCALE_SPEC, props);
  const isNamed = Boolean(rest['aria-label'] || rest['aria-labelledby']);

  return (
    <span
      {...rest}
      ref={ref}
      // No aria-valuenow: that is how ARIA says "in progress, how far unknown"
      role={isNamed ? 'progressbar' : undefined}
      aria-hidden={isNamed ? rest['aria-hidden'] : true}
      className={clsx(styles.spinner, classNames, className)}
      style={{ ...scaleStyle, ...style }}
    />
  );
});
