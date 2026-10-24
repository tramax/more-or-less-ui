import { forwardRef, type InputHTMLAttributes } from 'react';
import type { ScaleProp } from '@/types/scale';
import { TextFieldFrame } from '../_shared/TextFieldFrame';
import type { NameProps } from '../_shared/types';
import styles from './TextField.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export { TEXT_FIELD_DEFAULTS as TEXTFIELD_DEFAULTS } from '../_shared/TextFieldFrame';

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
  { type = 'text', ...props },
  ref,
) {
  return (
    <TextFieldFrame {...props} rootClassName={styles.root}>
      {(control, rest) => <input {...rest} {...control} ref={ref} type={type} />}
    </TextFieldFrame>
  );
});
