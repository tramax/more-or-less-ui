import type { ReactNode } from 'react';

/**
 * A field or group with no visible `label` must still have an accessible name. Intersect this into
 * the props of every labelled input component (TextField, Checkbox, Radio, ...).
 */
export type NameProps =
  | { label: string }
  | { label?: undefined; 'aria-label': string }
  | { label?: undefined; 'aria-labelledby': string };

/**
 * `NameProps` for a field or group whose visible label is drawn by `FieldLabel`, which can carry a
 * `tooltip`: a short explanation of the field behind an ⓘ button beside the label. Only with a visible
 * `label`, since the button hangs off it. (Toggle's label is the text beside its switch, so it keeps
 * plain `NameProps`.)
 */
export type FieldNameProps = NameProps &
  (
    | {
        label: string;
        /** What the field is, in a short sentence or two. Shown in a tooltip from an ⓘ button beside the label. */
        tooltip?: ReactNode;
      }
    | { label?: undefined; tooltip?: undefined }
  );

/** One choice in a group of options (Checkbox, Radio, ...). */
export interface OptionBase {
  value: string;
  label: string;
  /** Secondary line under the label, linked to the input with aria-describedby. */
  description?: string;
  /** Not clickable, not focusable, dimmed. Uses the native `disabled` attribute. */
  isDisabled?: boolean;
}
