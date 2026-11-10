import { forwardRef, type FieldsetHTMLAttributes, type ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { OptionGroupFrame } from '../_shared/OptionGroupFrame';
import { OptionIcon } from '../_shared/OptionIcon';
import { SlidingThumb, useSlidingThumb } from '../_shared/SlidingThumb';
import sizes from '../_shared/Size.module.css';
import type { NameProps, OptionBase } from '../_shared/types';
import { useChoice } from '../_shared/useChoice';
import styles from './SegmentedControl.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const SEGMENTED_CONTROL_DEFAULTS = {
  size: 'normal',
} as const;

// `size` sets font-size only: the padding and the gaps are in em (see SegmentedControl.module.css), so
// they follow it, escape-hatch values included. Its classes are _shared/Size.module.css, since `size`
// is the only scale prop.
const SCALE_SPEC = {
  // Empty, so the direct props are inferred as none rather than as any string
  direct: [],
  compound: { size: ['fontSize'] },
  defaults: SEGMENTED_CONTROL_DEFAULTS,
} as const;

export type SegmentOption = Omit<OptionBase, 'description'> & {
  /** A glyph before the label. Decorative: `label` stays the name. */
  icon?: ReactNode;
};

export type SegmentedControlProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'disabled' | 'name' | 'defaultValue' | 'color' | 'role' | 'children'
> &
  NameProps & {
    /** The segments, in order. Two to five fit; for more use Select. */
    options: SegmentOption[];
    /** Selected value (controlled). `null` is controlled with nothing selected. */
    value?: string | null;
    /** Selected value at the start (uncontrolled). Nothing is selected without it. */
    defaultValue?: string;
    /** Called with the newly selected value (not when the selected one is chosen again). */
    onChange?: (value: string) => void;
    /** Shared by the inputs, which is what makes them one group and submits the value. Generated when left out. */
    name?: string;
    /** Visible legend above the control. Without it, pass `aria-label` or `aria-labelledby`. */
    label?: string;
    /** Marks the group invalid and shows this message below it. The caller decides when. */
    error?: string;
    /** Disables every segment and dims the control. Uses the native `disabled` attribute. */
    isDisabled?: boolean;
    /** Native `required` on the inputs, plus an asterisk after the label. */
    isRequired?: boolean;
    /** Sets the font size; the padding and the gaps follow it. `1em` takes the surrounding text's size. */
    size?: ScaleProp;
  };

/**
 * One value out of a few, always in view: a quick filter (All / Unread / Starred), a view (List / Grid),
 * a period. It is a radio group drawn as one track with a thumb that slides to the chosen segment, and
 * it changes a *value*: for choosing between panels of content use Tabs, for a form's list of choices
 * with descriptions use Radio, for many choices use Select.
 *
 * The segments are native radio inputs, so the browser does the keyboard (← → ↑ ↓ move and select
 * together, wrapping; Tab enters and leaves the group), the form submission and `required`. Controlled
 * by `value` or kept inside from `defaultValue`, as Radio is.
 */
export const SegmentedControl = forwardRef<HTMLFieldSetElement, SegmentedControlProps>(
  function SegmentedControl(
    {
      options,
      value,
      defaultValue,
      onChange,
      name,
      isDisabled = false,
      isRequired = false,
      size,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const {
      classNames,
      style: scaleStyle,
      rest,
    } = resolveScaleProps(sizes, SCALE_SPEC, { ...props, size });
    const [selected, choose] = useChoice(value, defaultValue, onChange);

    // A value that names no segment selects none, so the thumb has nowhere to sit
    const selectedValue = options.some((option) => option.value === selected)
      ? (selected ?? undefined)
      : undefined;
    const thumb = useSlidingThumb(selectedValue);

    return (
      <OptionGroupFrame
        {...rest}
        ref={ref}
        role="radiogroup"
        isDisabled={isDisabled}
        isRequired={isRequired}
        className={clsx(styles.root, classNames, className)}
        style={{ ...scaleStyle, ...style }}
      >
        {({ rootId, hasError }) => (
          <div className={clsx(styles.track, hasError && styles.invalid)}>
            <SlidingThumb box={thumb.box} className={styles.thumb} />
            {options.map((option) => {
              const optionDisabled = isDisabled || Boolean(option.isDisabled);
              return (
                <label key={option.value} ref={thumb.ref(option.value)} className={styles.segment}>
                  <input
                    type="radio"
                    className={styles.input}
                    name={name ?? `${rootId}-name`}
                    value={option.value}
                    checked={option.value === selected}
                    disabled={optionDisabled}
                    required={isRequired}
                    aria-invalid={hasError || undefined}
                    onChange={() => {
                      if (!optionDisabled) choose(option.value);
                    }}
                  />
                  {option.icon != null && option.icon !== false && (
                    <OptionIcon className={styles.icon}>{option.icon}</OptionIcon>
                  )}
                  {option.label}
                </label>
              );
            })}
          </div>
        )}
      </OptionGroupFrame>
    );
  },
);
