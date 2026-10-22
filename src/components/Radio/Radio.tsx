import { forwardRef, useId, useState, type FieldsetHTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import shared from '../_shared/OptionGroup.module.css';
import styles from './Radio.module.css';

export interface RadioOption {
  value: string;
  label: string;
  /** Secondary line under the label, linked to the input with aria-describedby. */
  description?: string;
  /** Not clickable, not focusable, dimmed. Uses the native `disabled` attribute. */
  isDisabled?: boolean;
}

// A group with no visible label must still have an accessible name
type NameProps =
  | { label: string }
  | { label?: undefined; 'aria-label': string }
  | { label?: undefined; 'aria-labelledby': string };

export type RadioProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'disabled' | 'name' | 'defaultValue' | 'color' | 'role'
> &
  NameProps & {
    options: RadioOption[];
    /** Selected value (controlled). `null` is controlled with nothing selected. */
    value?: string | null;
    /** Selected value at the start (uncontrolled). Nothing is selected without it. */
    defaultValue?: string;
    /** Called with the newly selected value. A radio can't be cleared by the user. */
    onChange?: (value: string) => void;
    /** Shared by the inputs, which is what makes them one group. Generated when left out. */
    name?: string;
    /** Direction of the options. Defaults to vertical. */
    orientation?: 'horizontal' | 'vertical';
    /** Visible legend above the group. Without it, pass `aria-label` or `aria-labelledby`. */
    label?: string;
    /** Marks the group invalid and shows this message below it. The caller decides when. */
    error?: string;
    /** Disables every option and dims the group. Uses the native `disabled` attribute. */
    isDisabled?: boolean;
    /** Native `required` on the inputs, plus an asterisk after the label. */
    isRequired?: boolean;
  };

export const Radio = forwardRef<HTMLFieldSetElement, RadioProps>(function Radio(
  {
    options,
    value,
    defaultValue,
    onChange,
    name,
    orientation = 'vertical',
    label,
    error,
    isDisabled = false,
    isRequired = false,
    id,
    className,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const rootId = id ?? autoId;
  const errorId = `${rootId}-error`;
  const hasError = Boolean(error);

  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(defaultValue ?? null);
  const selected = value === undefined ? uncontrolledValue : value;

  return (
    <fieldset
      {...props}
      ref={ref}
      id={id}
      role="radiogroup"
      disabled={isDisabled}
      aria-describedby={clsx(describedBy, hasError && errorId) || undefined}
      className={clsx(shared.root, styles.root, isDisabled && shared.disabled, className)}
    >
      {label && (
        <legend className={shared.legend}>
          {label}
          {/* The native `required` already tells assistive tech, so the asterisk is visual only */}
          {isRequired && (
            <span className={shared.asterisk} aria-hidden="true">
              {' *'}
            </span>
          )}
        </legend>
      )}
      <div className={clsx(shared.options, shared[orientation])}>
        {options.map((option, index) => {
          const optionDisabled = isDisabled || Boolean(option.isDisabled);
          const descriptionId = option.description ? `${rootId}-${index}-description` : undefined;

          return (
            <label key={option.value} className={shared.option}>
              <span className={shared.control}>
                <input
                  type="radio"
                  className={clsx(shared.input, styles.input)}
                  name={name ?? `${rootId}-name`}
                  value={option.value}
                  checked={option.value === selected}
                  disabled={optionDisabled}
                  required={isRequired}
                  aria-invalid={hasError || undefined}
                  aria-describedby={descriptionId}
                  onChange={() => {
                    if (optionDisabled) return;
                    if (value === undefined) setUncontrolledValue(option.value);
                    onChange?.(option.value);
                  }}
                />
                <span className={clsx(shared.mark, styles.dot)} aria-hidden="true" />
              </span>
              <span className={shared.text}>
                <span>{option.label}</span>
                {option.description && (
                  <span id={descriptionId} className={shared.description}>
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {hasError && (
        <p id={errorId} className={shared.error}>
          {/* Color alone can't carry the state, so the message also gets an icon */}
          <svg className={shared.errorIcon} viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="currentColor" />
            <path d="M8 4.25v4.5" stroke="Canvas" strokeWidth="1.75" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="1" fill="Canvas" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
});
