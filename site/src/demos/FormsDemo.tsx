import { useState } from 'react';
import { TextField } from 'more-or-less-ui';
import { Cell } from './Cell';

const validate = (value: string): string | undefined => {
  if (!value) return 'Enter your email address';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter an email address like name@example.com';
  return undefined;
};

/**
 * The component doesn't validate: the caller decides when and passes `error`. Here, when the person
 * leaves the field, and then again on each keystroke so the message goes as soon as it is fixed.
 */
export function FormsDemo() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();

  return (
    <Cell promise="Type half an address and leave the field. The error waits until you do, says what to fix, sits below the field and has an icon.">
      <TextField
        label="Email"
        type="email"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError(validate(event.target.value));
        }}
        onBlur={() => setError(validate(value))}
        error={error}
        isRequired
        tooltip="Only used to send your receipt."
      />
    </Cell>
  );
}
