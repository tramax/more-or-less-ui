import { forwardRef, useState, type CSSProperties, type InputHTMLAttributes } from 'react';
import type { ScaleProp } from '@/types/scale';
import { TextFieldFrame } from '../_shared/TextFieldFrame';
import type { FieldNameProps } from '../_shared/types';
import styles from './Slider.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export { TEXT_FIELD_DEFAULTS as SLIDER_DEFAULTS } from '../_shared/TextFieldFrame';

export type SliderProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'min'
  | 'max'
  | 'step'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'size'
  | 'color'
  | 'list'
  | 'children'
> &
  FieldNameProps & {
    size?: ScaleProp;
    /** The value at the start of the track. */
    min?: number;
    /** The value at the end of the track. */
    max?: number;
    /** What one arrow-key press moves by, and what a drag snaps to. Zero or negative falls back to 1. */
    step?: number;
    /** The value (controlled). */
    value?: number;
    /** The value at the start (uncontrolled). The middle of the track without it. */
    defaultValue?: number;
    /** Called with the new value while it is dragged or keyed, not only when it is let go. */
    onChange?: (value: number) => void;
    /**
     * The value in words, for a screen reader (`aria-valuetext`): "30%", "Medium". Without it the
     * number is read.
     */
    formatValue?: (value: number) => string;
    /** Visible label above the track. Without it, pass `aria-label` or `aria-labelledby`. */
    label?: string;
    /**
     * Marks the slider invalid and shows this message below it. The caller decides when: a slider
     * always has a value, so this is for a value the rest of the form rejects.
     */
    error?: string;
    /** Not draggable, not focusable, dimmed. Uses the native `disabled` attribute. */
    isDisabled?: boolean;
  };

/** The nearest value the browser would show: held to min and max, on a step counted from min. */
function snap(value: number, min: number, max: number, step: number) {
  const held = Math.min(Math.max(value, min), max);
  let snapped = min + Math.round((held - min) / step) * step;
  if (snapped > max) snapped -= step; // the last step that still fits
  // 0.1 + 0.2: float noise from the multiplication would show in aria-valuetext and onChange
  return Number(snapped.toPrecision(12));
}

/**
 * Picks one number from a range by dragging a thumb along a track, or with the arrow keys. A native
 * `<input type="range">`, so the keys (arrows, Home, End, Page Up/Down), touch, form submission and
 * the `slider` role come from the browser. For a number that is typed, or must be exact, use
 * TextField with `type="number"`; for one of a few named choices, SegmentedControl.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { min = 0, max = 100, step: stepProp = 1, value, defaultValue, onChange, formatValue, ...props },
  ref,
) {
  const step = stepProp > 0 ? stepProp : 1;
  // The browser keeps the value of a range input itself, but the fill is drawn from it in CSS, so it
  // has to be known here as well: kept from `defaultValue` unless `value` is given
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? (min + max) / 2);
  const current = snap(value ?? uncontrolledValue, min, max, step);
  const percent = max > min ? ((current - min) / (max - min)) * 100 : 0;

  return (
    <TextFieldFrame {...props} rootClassName={styles.root}>
      {/* The frame's `className` is the look of a text field's box; a slider draws its own. A range
          input has no `readOnly` or `required`. */}
      {(
        { className: _boxClassName, readOnly: _readOnly, required: _required, ...control },
        rest,
      ) => (
        <input
          {...rest}
          {...control}
          ref={ref}
          type="range"
          className={styles.input}
          min={min}
          max={max}
          step={step}
          value={current}
          style={{ '--slider-value': percent } as CSSProperties}
          {...(formatValue && { 'aria-valuetext': formatValue(current) })}
          onChange={(event) => {
            const next = event.target.valueAsNumber;
            if (value === undefined) setUncontrolledValue(next);
            onChange?.(next);
          }}
        />
      )}
    </TextFieldFrame>
  );
});
