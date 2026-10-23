import type { ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import styles from './FieldLabel.module.css';

type FieldLabelProps = {
  isRequired?: boolean;
  /** Extra class on the label, for spacing. */
  className?: string;
  children: ReactNode;
} & ({ as: 'label'; htmlFor: string } | { as: 'legend'; htmlFor?: undefined });

/**
 * The visible name of a field (`as="label"`, pointing at its input) or of a group (`as="legend"`,
 * inside a fieldset).
 */
export function FieldLabel({ as, htmlFor, isRequired, className, children }: FieldLabelProps) {
  const content = (
    <>
      {children}
      {/* The native `required` already tells assistive tech, so the asterisk is visual only */}
      {isRequired && (
        <span className={styles.asterisk} aria-hidden="true">
          {' *'}
        </span>
      )}
    </>
  );
  const classes = clsx(styles.label, className);
  return as === 'label' ? (
    <label htmlFor={htmlFor} className={classes}>
      {content}
    </label>
  ) : (
    <legend className={classes}>{content}</legend>
  );
}
