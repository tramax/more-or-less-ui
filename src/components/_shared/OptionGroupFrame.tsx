import { forwardRef, useId, type FieldsetHTMLAttributes, type ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { FieldError } from './FieldError';
import { FieldLabel } from './FieldLabel';
import shared from './OptionGroup.module.css';

export type OptionGroupFrameProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'disabled' | 'children'
> & {
  /** Visible legend above the group. Without it, the caller passes `aria-label` or `aria-labelledby`. */
  label?: string;
  /** Marks the group invalid and shows this message below it. */
  error?: string;
  /** Disables the fieldset (so every control in it) and dims the group. */
  isDisabled?: boolean;
  /** The asterisk after the label. The controls carry the native `required` themselves. */
  isRequired?: boolean;
  /**
   * The controls. Handed the id the group's other ids are built from (`id`, or one generated) and
   * whether it shows an error, which each control repeats as `aria-invalid`.
   */
  children: (frame: { rootId: string; hasError: boolean }) => ReactNode;
};

/**
 * The frame of a group of options (Checkbox, Radio, SegmentedControl): the fieldset, the legend, the
 * error message under it, and the id wiring (`aria-describedby` from the fieldset to the message). A
 * component renders its controls in `children` and sets the look of its root through `className`.
 */
export const OptionGroupFrame = forwardRef<HTMLFieldSetElement, OptionGroupFrameProps>(
  function OptionGroupFrame(
    {
      label,
      error,
      isDisabled = false,
      isRequired = false,
      id,
      className,
      'aria-describedby': describedBy,
      children,
      ...props
    },
    ref,
  ) {
    const autoId = useId();
    const rootId = id ?? autoId;
    const errorId = `${rootId}-error`;
    const hasError = Boolean(error);

    return (
      <fieldset
        {...props}
        ref={ref}
        id={id}
        disabled={isDisabled}
        aria-describedby={clsx(describedBy, hasError && errorId) || undefined}
        className={clsx(shared.root, isDisabled && shared.disabled, className)}
      >
        {label && (
          <FieldLabel as="legend" isRequired={isRequired} className={shared.legend}>
            {label}
          </FieldLabel>
        )}
        {children({ rootId, hasError })}
        {hasError && (
          <FieldError id={errorId} className={shared.error}>
            {error}
          </FieldError>
        )}
      </fieldset>
    );
  },
);
