import { useControlledState } from './useControlledState';

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
  const [chosen, record] = useControlledState<string | null>(value, defaultValue ?? null);

  const choose = (next: string) => {
    record(next);
    onChange?.(next);
  };

  return [chosen, choose] as const;
}
