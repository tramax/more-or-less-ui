import { forwardRef, useState, type FieldsetHTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import shared from '../_shared/OptionGroup.module.css';
import { CheckControl } from '../_shared/CheckControl';
import { OptionGroupFrame } from '../_shared/OptionGroupFrame';
import { OptionText } from '../_shared/OptionText';
import type { NameProps, OptionBase } from '../_shared/types';
import styles from './Checkbox.module.css';

export type CheckboxOption = OptionBase;

export type CheckboxProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'disabled' | 'name' | 'defaultValue' | 'color'
> &
  NameProps & {
    options: CheckboxOption[];
    /** Checked values (controlled). */
    value?: string[];
    /** Checked values at the start (uncontrolled). */
    defaultValue?: string[];
    /** Called with the checked values in `options` order, not click order. */
    onChange?: (value: string[]) => void;
    /** Each checked input is submitted with this name. */
    name?: string;
    /** Direction of the options. Defaults to vertical. */
    orientation?: 'horizontal' | 'vertical';
    /**
     * Once this many are checked, they can't be unchecked. The checked options get `aria-disabled`
     * and stay focusable. A value that already breaks the limit is left alone: the caller reports
     * it through `error`.
     */
    minChecked?: number;
    /** Once this many are checked, the others can't be checked (`aria-disabled`, still focusable). */
    maxChecked?: number;
    /** Visible legend above the group. Without it, pass `aria-label` or `aria-labelledby`. */
    label?: string;
    /** Marks the group invalid and shows this message below it. The caller decides when. */
    error?: string;
    /** Disables every option and dims the group. Uses the native `disabled` attribute. */
    isDisabled?: boolean;
  };

export const Checkbox = forwardRef<HTMLFieldSetElement, CheckboxProps>(function Checkbox(
  {
    options,
    value,
    defaultValue,
    onChange,
    name,
    orientation = 'vertical',
    minChecked,
    maxChecked,
    isDisabled = false,
    className,
    ...props
  },
  ref,
) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? []);
  const checked = value ?? uncontrolledValue;

  // Only options count: a value that matches none is ignored
  const checkedCount = options.filter((option) => checked.includes(option.value)).length;
  const atMax = maxChecked !== undefined && checkedCount >= maxChecked;
  const atMin = minChecked !== undefined && checkedCount <= minChecked;

  const toggle = (toggled: string) => {
    const next = options
      .filter((option) =>
        option.value === toggled ? !checked.includes(toggled) : checked.includes(option.value),
      )
      .map((option) => option.value);
    if (value === undefined) setUncontrolledValue(next);
    onChange?.(next);
  };

  return (
    <OptionGroupFrame
      {...props}
      ref={ref}
      isDisabled={isDisabled}
      className={clsx(styles.root, className)}
    >
      {({ rootId, hasError }) => (
        <div className={clsx(shared.options, shared[orientation])}>
          {options.map((option, index) => {
            const isChecked = checked.includes(option.value);
            const optionDisabled = isDisabled || Boolean(option.isDisabled);
            // Blocked, not disabled: stays focusable so keyboard users don't lose their place
            const isBlocked = !optionDisabled && (isChecked ? atMin : atMax);
            const descriptionId = option.description ? `${rootId}-${index}-description` : undefined;

            return (
              <label key={option.value} className={shared.option}>
                <CheckControl
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  disabled={optionDisabled}
                  aria-disabled={isBlocked || undefined}
                  aria-invalid={hasError || undefined}
                  aria-describedby={descriptionId}
                  onChange={() => {
                    if (!isBlocked && !optionDisabled) toggle(option.value);
                  }}
                />
                <OptionText
                  label={option.label}
                  description={option.description}
                  descriptionId={descriptionId}
                />
              </label>
            );
          })}
        </div>
      )}
    </OptionGroupFrame>
  );
});
