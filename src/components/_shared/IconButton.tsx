import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentType,
  type MouseEventHandler,
} from 'react';
import { clsx } from '@/utils/clsx';
import styles from './IconButton.module.css';

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'children' | 'color' | 'disabled' | 'aria-label' | 'aria-labelledby'
> & {
  /** The accessible name: the icon is decorative. */
  label: string;
  /** A component (CrossIcon, ...) that takes a `className`; it is given the one that sizes and moves it. */
  icon: ComponentType<{ className: string | undefined }>;
  onClick: MouseEventHandler<HTMLButtonElement>;
  /** For a button inside a field: cancel it (`preventDefault`) so the field keeps focus. */
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
  /** Native `disabled`: dimmed, and out of the tab order. */
  isDisabled?: boolean;
  /** `-1` for a button the keyboard has another way to do (a stepper: the arrow keys). */
  tabIndex?: -1;
};

/**
 * A round icon button that takes the color and font size around it, with the disc on hover and the
 * shrink on press: CloseButton's, and TextField's reveal and stepper buttons, and DatePicker's calendar
 * button. It is a plain `type="button"`, named by `label`. Spacing and alignment go through `className`.
 *
 * It takes a `ref` and the other button attributes, so an overlay can use it as its trigger (Popover
 * clones its trigger with a ref, `aria-expanded` and the rest).
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon: Icon, isDisabled = false, className, ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={clsx(styles.button, className)}
      aria-label={label}
      disabled={isDisabled}
    >
      <Icon className={styles.icon} />
    </button>
  );
});
