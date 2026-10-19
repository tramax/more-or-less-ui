import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import styles from './Button.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const BUTTON_DEFAULTS = {
  size: 'normal',
  background: 'normal',
} as const;

// Border radius, font weight and box shadow are not props: Button.module.css fixes them.
const SCALE_SPEC = {
  // Each drives the CSS property of the same name
  direct: ['background'],
  // `size` sets font-size only: the padding and the gap between children are in em (see
  // Button.module.css), so they follow it, escape-hatch values included.
  compound: { size: ['fontSize'] },
  defaults: BUTTON_DEFAULTS,
} as const;

type ScalePropName = keyof typeof BUTTON_DEFAULTS;

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'disabled'> &
  Partial<Record<ScalePropName, ScaleProp>> & {
    /** Not clickable, not focusable, dimmed. Uses the native `disabled` attribute. */
    isDisabled?: boolean;
    /**
     * Shows a spinner in place of the content and ignores clicks. The button stays focusable (it
     * sets `aria-disabled`, not `disabled`) so keyboard users don't lose their place.
     */
    isLoading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    isDisabled = false,
    isLoading = false,
    type = 'button',
    onClick,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(styles, SCALE_SPEC, props);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isLoading) {
      // Also stops a loading submit button from submitting its form
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-disabled={isLoading || undefined}
      aria-busy={isLoading || undefined}
      className={clsx(styles.button, classNames, isLoading && styles.loading, className)}
      style={{ ...scaleStyle, ...style }}
      onClick={handleClick}
    >
      {/* Stays in the layout (just transparent) while loading, so the button keeps its width and its accessible name */}
      <span className={styles.content}>{children}</span>
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  );
});
