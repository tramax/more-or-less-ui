import { useState } from 'react';

/**
 * A value that is controlled when `value` is given, or kept here from `defaultValue` when it is
 * `undefined` (useChoice: Radio and SegmentedControl; FileUpload). `record` stores a new value only
 * in the second case; the caller still calls its own `onChange`, in both.
 */
export function useControlledState<T>(value: T | undefined, defaultValue: T) {
  const [uncontrolledValue, setUncontrolledValue] = useState<T>(defaultValue);

  const record = (next: T) => {
    if (value === undefined) setUncontrolledValue(next);
  };

  return [value === undefined ? uncontrolledValue : value, record] as const;
}
