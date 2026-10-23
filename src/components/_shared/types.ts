/**
 * A field or group with no visible `label` must still have an accessible name. Intersect this into
 * the props of every labelled input component (TextField, Checkbox, Radio, ...).
 */
export type NameProps =
  | { label: string }
  | { label?: undefined; 'aria-label': string }
  | { label?: undefined; 'aria-labelledby': string };

/** One choice in a group of options (Checkbox, Radio, ...). */
export interface OptionBase {
  value: string;
  label: string;
  /** Secondary line under the label, linked to the input with aria-describedby. */
  description?: string;
  /** Not clickable, not focusable, dimmed. Uses the native `disabled` attribute. */
  isDisabled?: boolean;
}
