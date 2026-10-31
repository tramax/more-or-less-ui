import { forwardRef, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { CrossIcon } from '../_shared/CrossIcon';
import { OptionIcon } from '../_shared/OptionIcon';
import styles from './Chip.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const CHIP_DEFAULTS = {
  size: 'normal',
  borderRadius: 'normal',
  background: 'normal',
} as const;

// The height (1.5em) is not a prop: Chip.module.css fixes it.
const SCALE_SPEC = {
  // Each drives the CSS property of the same name
  direct: ['borderRadius', 'background'],
  // `size` sets font-size only: the height, the padding and the gaps are in em (see Chip.module.css),
  // so they follow it, escape-hatch values included. `size="1em"` takes the surrounding text's size.
  compound: { size: ['fontSize'] },
  defaults: CHIP_DEFAULTS,
} as const;

export type ChipProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'children'> & {
  size?: ScaleProp;
  /**
   * The corners, from nearly square (`less`) through rounded (`normal`) to a full pill (`more`). Round
   * ones, not Card's squircle. In em, so they follow `size`. A CSS value such as `999px` works too.
   */
  borderRadius?: ScaleProp;
  /**
   * How it stands out: an outline with nothing behind the label (`less`), a semi-transparent brand tint
   * (`normal`), the brand color itself (`more`). It is not a kind of label (info, error, ...); the text says that.
   */
  background?: ScaleProp;
  /** The label. Short text; it also names the remove button ("Remove <label>"). */
  children: string;
  /** Shown before the label: a flag, an avatar, a logo. Decorative: the label is the name. */
  icon?: ReactNode;
  /**
   * Adds a remove button (a ×), and makes the whole chip the target: a click anywhere on it calls
   * this. The chip doesn't hide itself: the caller stops rendering it. Leave it out for a label that
   * stays.
   */
  onRemove?: () => void;
  /**
   * The chip sits in a field that is already one Tab stop and removes its last chip with Backspace
   * (Select): the remove button leaves the tab order. Elsewhere the button is a Tab stop, so a
   * keyboard can remove the chip.
   */
  isInField?: boolean;
};

/**
 * A small label in a pill: a tag, a status word ("Beta"), or a selected value that can be taken out
 * again. Not interactive but for the remove button; wrap it in a link or a button when it should be.
 */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { children, icon, onRemove, isInField = false, onClick, onMouseDown, className, style, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(styles, SCALE_SPEC, props);

  return (
    // The whole chip is the target, so a click anywhere on it removes. The button inside is its
    // accessible name and what assistive tech activates; its click bubbles up to here. mousedown is
    // cancelled so a field around the chip keeps focus. The click is marked handled (preventDefault)
    // so the field around the chip doesn't also open its popup.
    <span
      {...rest}
      ref={ref}
      className={clsx(styles.chip, classNames, onRemove && styles.removable, className)}
      style={{ ...scaleStyle, ...style }}
      onMouseDown={(event: MouseEvent<HTMLSpanElement>) => {
        onMouseDown?.(event);
        if (onRemove) event.preventDefault();
      }}
      onClick={(event: MouseEvent<HTMLSpanElement>) => {
        onClick?.(event);
        if (!onRemove) return;
        event.preventDefault();
        onRemove();
      }}
    >
      {icon != null && icon !== false && <OptionIcon className={styles.leading}>{icon}</OptionIcon>}
      <span className={styles.label}>{children}</span>
      {onRemove && (
        <button
          type="button"
          tabIndex={isInField ? -1 : undefined}
          className={styles.remove}
          aria-label={`Remove ${children}`}
        >
          <CrossIcon className={styles.icon} />
        </button>
      )}
    </span>
  );
});
