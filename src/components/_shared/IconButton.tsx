import type { ComponentType, MouseEventHandler } from 'react';
import { clsx } from '@/utils/clsx';
import styles from './IconButton.module.css';

/**
 * A round icon button that takes the color and font size around it, with the disc on hover and the
 * shrink on press: CloseButton's, and TextField's reveal and stepper buttons. It is a plain
 * `type="button"`, named by `label`. `icon` is a component (CrossIcon, ...) that takes a `className`;
 * it is given the one that sizes and moves it. Spacing and alignment go through `className`.
 */
export function IconButton({
  label,
  icon: Icon,
  onClick,
  onMouseDown,
  isDisabled = false,
  tabIndex,
  className,
}: {
  label: string;
  icon: ComponentType<{ className: string | undefined }>;
  onClick: () => void;
  /** For a button inside a field: cancel it (`preventDefault`) so the field keeps focus. */
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
  /** Native `disabled`: dimmed, and out of the tab order. */
  isDisabled?: boolean;
  /** `-1` for a button the keyboard has another way to do (a stepper: the arrow keys). */
  tabIndex?: -1;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={clsx(styles.button, className)}
      aria-label={label}
      disabled={isDisabled}
      tabIndex={tabIndex}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <Icon className={styles.icon} />
    </button>
  );
}
