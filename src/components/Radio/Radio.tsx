import { forwardRef, useId, useState, type FieldsetHTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import shared from '../_shared/OptionGroup.module.css';
import { FieldError } from '../_shared/FieldError';
import { FieldLabel } from '../_shared/FieldLabel';
import { OptionText } from '../_shared/OptionText';
import type { NameProps, OptionBase } from '../_shared/types';
import styles from './Radio.module.css';

export type RadioOption = OptionBase;

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
        <FieldLabel as="legend" isRequired={isRequired} className={shared.legend}>
          {label}
        </FieldLabel>
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
              <OptionText
                label={option.label}
                description={option.description}
                descriptionId={descriptionId}
              />
            </label>
          );
        })}
      </div>
      {hasError && (
        <FieldError id={errorId} className={shared.error}>
          {error}
        </FieldError>
      )}
    </fieldset>
  );
});
