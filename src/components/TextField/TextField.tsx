import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type MouseEvent,
} from 'react';
import { clsx } from '@/utils/clsx';
import type { ScaleProp } from '@/types/scale';
import { IconButton } from '../_shared/IconButton';
import { TextFieldFrame } from '../_shared/TextFieldFrame';
import type { NameProps } from '../_shared/types';
import { EyeIcon, EyeOffIcon, MinusIcon, PlusIcon } from './FieldIcons';
import styles from './TextField.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export { TEXT_FIELD_DEFAULTS as TEXTFIELD_DEFAULTS } from '../_shared/TextFieldFrame';

type TextFieldBaseProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  // `size` is the native character width, replaced by the scale prop
  'size' | 'color' | 'disabled' | 'readOnly' | 'required' | 'type'
> &
  NameProps & {
    size?: ScaleProp;
    /** Visible label above the field. Without it, pass `aria-label` or `aria-labelledby`. */
    label?: string;
    /**
     * Marks the field invalid and shows this message below it. The caller decides when: validate
     * when the user leaves the field, not on every keystroke.
     */
    error?: string;
    /** Not editable, not focusable, dimmed. Uses the native `disabled` attribute. */
    isDisabled?: boolean;
    /**
     * Not editable, but submitted with the form and selectable. Reads as plain text: no fill, no
     * padding, and Tab skips it.
     */
    isReadOnly?: boolean;
    /** Native `required`, plus an asterisk after the label. */
    isRequired?: boolean;
  };

// What `type` unlocks: the extra props only exist where they mean something
export type TextFieldProps = TextFieldBaseProps &
  (
    | {
        type?: 'text' | 'email' | 'search' | 'tel' | 'url';
        isRevealable?: never;
        hasSteppers?: never;
      }
    | {
        type: 'password';
        /** A button at the end of the field shows the password as text, and hides it again. */
        isRevealable?: boolean;
        hasSteppers?: never;
      }
    | {
        type: 'number';
        isRevealable?: never;
        /**
         * − and + buttons at the end of the field, for the pointer: they step by `step` (default 1)
         * within `min` and `max`, like the arrow keys, which always work. Not shown with
         * `step="any"` or when read-only. The native spin buttons are always hidden.
         */
        hasSteppers?: boolean;
      }
  );

// The native input is the source of truth for the value, so the stepper buttons ask it. `stepUp` and
// `stepDown` throw when `step="any"`, which the buttons are not shown for.
function stepBy(input: HTMLInputElement, direction: 1 | -1) {
  if (direction > 0) input.stepUp();
  else input.stepDown();
  // `stepUp` is silent: this is what makes React call onChange, for a controlled field too
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// Would a step in this direction change the value? Asked of a copy, so the real input is untouched
// (and `max`, `step` and an empty value are all the browser's rules).
function canStep(input: HTMLInputElement, direction: 1 | -1) {
  const probe = input.cloneNode() as HTMLInputElement;
  probe.value = input.value;
  try {
    if (direction > 0) probe.stepUp();
    else probe.stepDown();
  } catch {
    return false;
  }
  return probe.value !== input.value;
}

// A click on a button inside the field is not a blur
const keepFocus = (event: MouseEvent) => event.preventDefault();

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { type = 'text', isRevealable = false, hasSteppers = false, ...props },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const [isRevealed, setIsRevealed] = useState(false);
  const [canUp, setCanUp] = useState(true);
  const [canDown, setCanDown] = useState(true);

  const isDisabled = props.isDisabled ?? false;
  const showSteppers =
    type === 'number' && hasSteppers && !props.isReadOnly && props.step !== 'any';
  const syncSteppers = () => {
    const input = inputRef.current;
    if (!input || !showSteppers) return;
    setCanUp(canStep(input, 1));
    setCanDown(canStep(input, -1));
  };
  // After every render: a controlled value, `min`, `max` or `step` can change without an event
  useLayoutEffect(syncSteppers);

  const step = (direction: 1 | -1) => {
    if (inputRef.current) stepBy(inputRef.current, direction);
  };

  let end;
  let endCount = 1;
  if (type === 'password' && isRevealable) {
    end = (
      <IconButton
        label={isRevealed ? 'Hide password' : 'Show password'}
        icon={isRevealed ? EyeOffIcon : EyeIcon}
        isDisabled={isDisabled}
        onMouseDown={keepFocus}
        onClick={() => setIsRevealed(!isRevealed)}
      />
    );
  } else if (showSteppers) {
    endCount = 2;
    // Out of the tab order: the arrow keys on the input do the same, and a spinbutton is one stop
    end = (
      <>
        <IconButton
          label="Decrease"
          icon={MinusIcon}
          tabIndex={-1}
          isDisabled={isDisabled || !canDown}
          onMouseDown={keepFocus}
          onClick={() => step(-1)}
        />
        <IconButton
          label="Increase"
          icon={PlusIcon}
          tabIndex={-1}
          isDisabled={isDisabled || !canUp}
          onMouseDown={keepFocus}
          onClick={() => step(1)}
        />
      </>
    );
  }

  const { onChange } = props;
  return (
    <TextFieldFrame {...props} rootClassName={styles.root} end={end} endCount={endCount}>
      {({ className, ...control }, rest) => (
        <input
          {...rest}
          {...control}
          ref={setRef}
          className={clsx(className, type === 'number' && styles.number)}
          type={type === 'password' && isRevealable && isRevealed ? 'text' : type}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange?.(event);
            syncSteppers();
          }}
        />
      )}
    </TextFieldFrame>
  );
});
