import { useId, type CSSProperties, type ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { FieldError } from './FieldError';
import { FieldLabel } from './FieldLabel';
import styles from './TextFieldFrame.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults. TextField,
// Textarea and Select re-export it under their own names.
export const TEXT_FIELD_DEFAULTS = {
  size: 'normal',
} as const;

// `size` sets font-size only: the padding and the gaps are in em (see TextFieldFrame.module.css), so
// they follow it, escape-hatch values included.
const SCALE_SPEC = {
  // Empty, so the direct props are inferred as none rather than as any string
  direct: [],
  compound: { size: ['fontSize'] },
  defaults: TEXT_FIELD_DEFAULTS,
} as const;

/** What the control (an `<input>`, a `<textarea>`) gets from the frame. Spread it onto the element. */
export interface TextFieldControlProps {
  id: string;
  className: string;
  disabled: boolean;
  readOnly: boolean;
  /** -1 when read-only, so Tab skips it. Absent otherwise, so the consumer's own `tabIndex` stands. */
  tabIndex?: -1;
  required: boolean;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
}

/** What else the frame knows, for a control that is not an input (see `children`). */
export interface TextFieldFrameInfo {
  /** The label's id, or `undefined` without a label. A group of segments (DateField) names itself with it. */
  labelId: string | undefined;
}

/** The props the frame takes out of a field's props; the rest belong to the control. */
interface TextFieldFrameOwnProps {
  size?: ScaleProp;
  label?: string;
  error?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  id?: string;
  /** The consumer's own, kept alongside the error message's id. */
  'aria-describedby'?: string;
  /** On the root, with the scale classes, so `size` reaches the label and the message too. */
  className?: string;
  style?: CSSProperties;
}

type TextFieldFrameProps<P> = P & {
  /** The component's own root class, which sets the `--field-*` color hooks. */
  rootClassName: string | undefined;
  /**
   * Buttons at the inline end of the control, inside the field (TextField's reveal and steppers). Pass
   * `IconButton`s, and how many as `endCount`, so the control leaves room for them.
   */
  end?: ReactNode;
  endCount?: number;
  /**
   * Renders the control from what the frame gives it and the field props the frame didn't use. The third
   * argument is for a control that is not a labelable element, and most ignore it.
   */
  children: (
    control: TextFieldControlProps,
    rest: Omit<P, keyof TextFieldFrameOwnProps | 'rootClassName' | 'children'>,
    info: TextFieldFrameInfo,
  ) => ReactNode;
};

/**
 * The frame of a single-control field (TextField, Textarea, Select): the root, the `size` scale, the
 * label, the error message, and the id, `aria-invalid` and `aria-describedby` wiring that ties them
 * to the control. Pass it the field's props as they came in; it takes the ones above and hands the
 * rest to `children` with the control's props. The component renders only the control, so each keeps
 * its own element and `ref` type. A control that doesn't take some of them (Select has no `readOnly`)
 * ignores those.
 */
export function TextFieldFrame<P extends TextFieldFrameOwnProps>({
  rootClassName,
  end,
  endCount = 1,
  children,
  ...props
}: TextFieldFrameProps<P>) {
  const {
    label,
    error,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    id,
    'aria-describedby': describedBy,
    className,
    style,
    ...fieldProps
  } = props;
  const hasEnd = Boolean(end);
  const autoId = useId();
  const controlId = id ?? autoId;
  const errorId = `${controlId}-error`;
  const labelId = label ? `${controlId}-label` : undefined;
  const hasError = Boolean(error);

  const {
    classNames,
    style: scaleStyle,
    rest,
  } = resolveScaleProps(styles, SCALE_SPEC, fieldProps as { size?: ScaleProp });

  const control = children(
    {
      id: controlId,
      className: styles.control as string,
      disabled: isDisabled,
      readOnly: isReadOnly,
      ...(isReadOnly && { tabIndex: -1 as const }),
      required: isRequired,
      'aria-invalid': hasError || undefined,
      'aria-describedby': clsx(describedBy, hasError && errorId) || undefined,
    },
    rest as Omit<P, keyof TextFieldFrameOwnProps | 'rootClassName' | 'children'>,
    { labelId },
  );

  return (
    // className and style go on the root, so the scale classes and `size` reach the label and the
    // message too
    <div
      className={clsx(
        styles.root,
        classNames,
        isDisabled && styles.disabled,
        hasError && styles.invalid,
        rootClassName,
        className,
      )}
      style={{ ...scaleStyle, ...style }}
    >
      {label && (
        <FieldLabel as="label" id={labelId} htmlFor={controlId} isRequired={isRequired}>
          {label}
        </FieldLabel>
      )}
      {hasEnd ? (
        // A wrapper only when there is something to put over the control, so a plain field's DOM is
        // just its control
        <div className={styles.field} style={{ '--field-end-count': endCount } as CSSProperties}>
          {control}
          <div className={styles.end}>{end}</div>
        </div>
      ) : (
        control
      )}
      {hasError && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
