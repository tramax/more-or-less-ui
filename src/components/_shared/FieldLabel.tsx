import type { ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { Tooltip } from '../Tooltip';
import { IconButton } from './IconButton';
import { InfoIcon } from './InfoIcon';
import styles from './FieldLabel.module.css';

type FieldLabelProps = {
  /** For a control that names itself by it with `aria-labelledby` (a group of segments, DateField). */
  id?: string | undefined;
  isRequired?: boolean;
  /**
   * An explanation of the field, in a tooltip from an ⓘ button beside the label. The button is a
   * sibling of the label, not inside it, so it is not part of the field's name.
   */
  tooltip?: ReactNode;
  /** Extra class on the label, for spacing. */
  className?: string;
  children: string;
} & ({ as: 'label'; htmlFor: string } | { as: 'legend'; htmlFor?: undefined });

// Pressing the button does nothing: the tooltip shows on focus and on hover
const noop = () => {};

/**
 * The visible name of a field (`as="label"`, pointing at its input) or of a group (`as="legend"`,
 * inside a fieldset).
 *
 * With a `tooltip`, the label and the ⓘ button sit in a row. A legend then holds the row, and its text
 * is a `<span>` that the caller must point the fieldset's `aria-labelledby` at (`id`), or the button's
 * name would be read as part of the group's.
 */
export function FieldLabel({
  as,
  id,
  htmlFor,
  isRequired,
  tooltip,
  className,
  children,
}: FieldLabelProps) {
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

  if (!tooltip) {
    const classes = clsx(styles.label, className);
    return as === 'label' ? (
      <label id={id} htmlFor={htmlFor} className={classes}>
        {content}
      </label>
    ) : (
      <legend id={id} className={classes}>
        {content}
      </legend>
    );
  }

  const help = (
    <Tooltip content={tooltip}>
      <IconButton
        label={`About ${children}`}
        icon={InfoIcon}
        className={styles.help}
        onClick={noop}
      />
    </Tooltip>
  );
  // The label's type is on the text only: the tooltip is a DOM child of the row and follows its font,
  // which must not be the label's small semibold
  return as === 'label' ? (
    <div className={clsx(styles.row, className)}>
      <label id={id} htmlFor={htmlFor} className={styles.label}>
        {content}
      </label>
      {help}
    </div>
  ) : (
    <legend className={className}>
      <div className={styles.row}>
        <span id={id} className={styles.label}>
          {content}
        </span>
        {help}
      </div>
    </legend>
  );
}
