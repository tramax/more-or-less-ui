import { useEffect, useRef, type InputHTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import shared from './OptionGroup.module.css';
import { CheckIcon } from './CheckIcon';
import styles from './CheckControl.module.css';

export type CheckControlProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  /**
   * Neither on nor off: some of a set are checked (a table's select-all). Drawn as a dash on the brand
   * color. It is a property the DOM has no attribute for, so it is set on the input; the checked state
   * stays the caller's (an indeterminate box is normally unchecked), and a click still toggles it.
   */
  isIndeterminate?: boolean;
  /** Goes on the `<span>` around the input and its mark, not on the input (`className` does). */
  controlClassName?: string;
};

/**
 * The box and tick of a checkbox: a native `<input type="checkbox">` drawn as a rounded square that
 * fills with the brand color when checked, with a tick that draws itself in. Checkbox puts one in each
 * option row; Table puts one in each row it can select. It is only the control: the label, the row and
 * the group around it are the caller's.
 *
 * The tick's color is `--color-checkbox-check`, for every caller: a checkbox looks the same wherever it
 * is, so a caller has no color of its own to pass.
 */
export function CheckControl({
  isIndeterminate = false,
  className,
  controlClassName,
  ...props
}: CheckControlProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);

  return (
    <span className={clsx(shared.control, styles.control, controlClassName)}>
      <input
        {...props}
        ref={ref}
        type="checkbox"
        className={clsx(shared.input, styles.input, className)}
      />
      <CheckIcon className={clsx(shared.mark, styles.check)} />
    </span>
  );
}
