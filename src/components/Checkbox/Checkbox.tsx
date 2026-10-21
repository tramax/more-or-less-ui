import { forwardRef, useId, useState, type FieldsetHTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import styles from './Checkbox.module.css';

export interface CheckboxOption {
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
    label,
    error,
    isDisabled = false,
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
    <fieldset
      {...props}
      ref={ref}
      id={id}
      disabled={isDisabled}
      aria-describedby={clsx(describedBy, hasError && errorId) || undefined}
      className={clsx(styles.root, isDisabled && styles.disabled, className)}
    >
      {label && <legend className={styles.legend}>{label}</legend>}
      <div className={clsx(styles.options, styles[orientation])}>
        {options.map((option, index) => {
          const isChecked = checked.includes(option.value);
          const optionDisabled = isDisabled || Boolean(option.isDisabled);
          // Blocked, not disabled: stays focusable so keyboard users don't lose their place
          const isBlocked = !optionDisabled && (isChecked ? atMin : atMax);
          const descriptionId = option.description ? `${rootId}-${index}-description` : undefined;

          return (
            <label key={option.value} className={styles.option}>
              <span className={styles.box}>
                <input
                  type="checkbox"
                  className={styles.input}
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
                {/* Drawn by a sibling, since an appearance: none input can't reliably hold a pseudo-element */}
                <svg className={styles.check} viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 8.5l3 3 6-7" pathLength={1} />
                </svg>
              </span>
              <span className={styles.text}>
                <span>{option.label}</span>
                {option.description && (
                  <span id={descriptionId} className={styles.description}>
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {hasError && (
        <p id={errorId} className={styles.error}>
          {/* Color alone can't carry the state, so the message also gets an icon */}
          <svg className={styles.errorIcon} viewBox="0 0 16 16" aria-hidden="true">
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
