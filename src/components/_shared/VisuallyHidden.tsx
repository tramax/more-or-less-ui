import type { HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import styles from './VisuallyHidden.module.css';

/**
 * Text for screen readers only. It is not `display: none` or `hidden`, which would take it out of the
 * accessibility tree, so it can hold a live region (ToastProvider's announcer). Native props go on the `<span>`.
 */
export function VisuallyHidden({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={clsx(styles.hidden, className)} />;
}
