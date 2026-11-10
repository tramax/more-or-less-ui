import { useState } from 'react';

/**
 * The state of a group where one option is chosen (Radio, SegmentedControl): controlled by `value`
 * (`null` is controlled with nothing chosen), or kept here from `defaultValue` when `value` is
 * `undefined`. `choose` records the choice if it is kept here, and calls `onChange` either way.
 */
export function useChoice(
  value: string | null | undefined,
  defaultValue: string | undefined,
  onChange: ((value: string) => void) | undefined,
) {
  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(defaultValue ?? null);
  const chosen = value === undefined ? uncontrolledValue : value;

  const choose = (next: string) => {
    if (value === undefined) setUncontrolledValue(next);
    onChange?.(next);
  };

  return [chosen, choose] as const;
}
