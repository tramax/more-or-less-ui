import type { ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import styles from './FieldError.module.css';

interface FieldErrorProps {
  /** Linked to the field with aria-describedby by the caller. */
  id: string;
  /** Extra class on the message, for spacing. */
  className?: string;
  children: ReactNode;
}

/** The error message under a field or a group, with an icon so color isn't the only cue. */
export function FieldError({ id, className, children }: FieldErrorProps) {
  return (
    <p id={id} className={clsx(styles.error, className)}>
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path d="M8 4.25v4.5" stroke="Canvas" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="1" fill="Canvas" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
