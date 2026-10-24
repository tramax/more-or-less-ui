import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import type { ScaleProp } from '@/types/scale';
import { TextFieldFrame } from '../_shared/TextFieldFrame';
import type { NameProps } from '../_shared/types';
import styles from './Textarea.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export { TEXT_FIELD_DEFAULTS as TEXTAREA_DEFAULTS } from '../_shared/TextFieldFrame';

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'color' | 'disabled' | 'readOnly' | 'required'
> &
  NameProps & {
    size?: ScaleProp;
    /** Visible rows of text. The user can still resize it unless `resize` is `none`. */
    rows?: number;
    /** Which way the user can drag the corner handle. */
    resize?: 'none' | 'vertical';
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

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { rows = 3, resize = 'vertical', ...props },
  ref,
) {
  return (
    <TextFieldFrame {...props} rootClassName={styles.root}>
      {({ className, ...control }, rest) => (
        <textarea
          {...rest}
          {...control}
          ref={ref}
          rows={rows}
          className={clsx(className, resize === 'none' ? styles.resizeNone : styles.resizeVertical)}
        />
      )}
    </TextFieldFrame>
  );
});
