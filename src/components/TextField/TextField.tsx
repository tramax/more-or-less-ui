import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { FieldError } from '../_shared/FieldError';
import { FieldLabel } from '../_shared/FieldLabel';
import type { NameProps } from '../_shared/types';
import styles from './TextField.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const TEXTFIELD_DEFAULTS = {
  size: 'normal',
} as const;

// Background, border radius and font weight are not props: TextField.module.css fixes them.
const SCALE_SPEC = {
  // Empty, so the direct props are inferred as none rather than as any string
  direct: [],
  // `size` sets font-size only: the padding and the gaps are in em (see TextField.module.css), so
  // they follow it, escape-hatch values included.
  compound: { size: ['fontSize'] },
  defaults: TEXTFIELD_DEFAULTS,
} as const;

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  // `size` is the native character width, replaced by the scale prop
  'size' | 'color' | 'disabled' | 'readOnly' | 'required' | 'type'
> &
  NameProps & {
    size?: ScaleProp;
    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
    /** Visible label above the field. Without it, pass `aria-label` or `aria-labelledby`. */
    label?: string;
    /**
     * Marks the field invalid and shows this message below it. The caller decides when: validate
     * when the user leaves the field, not on every keystroke.
     */
    error?: string;
    /** Not editable, not focusable, dimmed. Uses the native `disabled` attribute. */
    isDisabled?: boolean;
    /** Focusable and submitted with the form, but not editable. Drops the fill. */
    isReadOnly?: boolean;
    /** Native `required`, plus an asterisk after the label. */
    isRequired?: boolean;
  };

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    error,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    type = 'text',
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
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);

  const { classNames, style: scaleStyle, rest } = resolveScaleProps(styles, SCALE_SPEC, props);

  return (
    // className and style go on the root, so the scale classes and `size` reach the label and the
    // message too; everything else goes on the input
    <div
      className={clsx(
        styles.root,
        classNames,
        isDisabled && styles.disabled,
        hasError && styles.invalid,
        className,
      )}
      style={{ ...scaleStyle, ...style }}
    >
      {label && (
        <FieldLabel as="label" htmlFor={inputId} isRequired={isRequired}>
          {label}
        </FieldLabel>
      )}
      <input
        {...rest}
        ref={ref}
        id={inputId}
        type={type}
        disabled={isDisabled}
        readOnly={isReadOnly}
        required={isRequired}
        aria-invalid={hasError || undefined}
        aria-describedby={clsx(describedBy, hasError && errorId) || undefined}
        className={styles.input}
      />
      {hasError && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
});
