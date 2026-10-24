import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import shared from '../_shared/OptionGroup.module.css';
import { OptionText } from '../_shared/OptionText';
import type { NameProps } from '../_shared/types';
import styles from './Toggle.module.css';

export type ToggleProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'role'
  | 'checked'
  | 'defaultChecked'
  | 'onChange'
  | 'disabled'
  | 'value'
  | 'defaultValue'
  | 'required'
  | 'readOnly'
  | 'size'
  | 'color'
  | 'children'
> &
  NameProps & {
    /** On or off (controlled). */
    checked?: boolean;
    /** On or off at the start (uncontrolled). Off without it. */
    defaultChecked?: boolean;
    /** Called with the new state. */
    onChange?: (checked: boolean) => void;
    /** Submitted with this name while on. */
    name?: string;
    /** Submitted while on. Defaults to the browser's `on`. */
    value?: string;
    /** Secondary line under the label, linked to the input with aria-describedby. */
    description?: string;
    /** Not clickable, not focusable, dimmed. Uses the native `disabled` attribute. */
    isDisabled?: boolean;
  };

/**
 * A switch for one setting that takes effect as soon as it is flipped. For a choice that waits for a
 * Save or Submit, or for picking several from a list, use Checkbox. `label` is the text beside the
 * switch; without it, pass `aria-label` or `aria-labelledby`.
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  {
    label,
    description,
    checked,
    defaultChecked,
    onChange,
    isDisabled = false,
    id,
    className,
    style,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    // className and style go on the root; `ref`, `id` and the rest on the input, as in TextField
    <label className={clsx(styles.root, isDisabled && styles.disabled, className)} style={style}>
      <span className={clsx(shared.control, styles.control)}>
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="checkbox"
          role="switch"
          className={clsx(shared.input, styles.input)}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={isDisabled}
          aria-describedby={clsx(describedBy, descriptionId) || undefined}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        {/* The thumb says the state itself, not only by position and color: a tick when on, a cross
            when off. Both icons are drawn; CSS shows the one that matches. */}
        <span className={clsx(shared.mark, styles.thumb)} aria-hidden="true">
          <svg className={clsx(styles.icon, styles.on)} viewBox="0 0 16 16">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
          <svg className={clsx(styles.icon, styles.off)} viewBox="0 0 16 16">
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
          </svg>
        </span>
      </span>
      {label && (
        <OptionText label={label} description={description} descriptionId={descriptionId} />
      )}
    </label>
  );
});
