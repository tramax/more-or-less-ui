import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { TextField, TEXTFIELD_DEFAULTS } from './TextField';

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

// The Size story renders all three variants at once, so its controls would do nothing. Its render
// returns <Sizes>, which Storybook can't turn into <TextField> code, so spell the snippet out.
const comparison = {
  controls: { disable: true },
  docs: {
    source: {
      code: VARIANTS.map((v) => `<TextField size="${v}" label="size=&quot;${v}&quot;" />`).join(
        '\n\n',
      ),
      transform: (code: string) => code,
    },
  },
};

const Column = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof TextField> = {
  title: 'Inputs/TextField',
  component: TextField,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...TEXTFIELD_DEFAULTS, label: 'Name' },
  parameters: { docs: { source: { transform: omitDefaults(TEXTFIELD_DEFAULTS) } } },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem', maxWidth: '100%', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: TEXTFIELD_DEFAULTS.size } },
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'],
      table: { defaultValue: { summary: 'text' } },
    },
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  args: { placeholder: 'Ada Lovelace' },
};

export const Size: Story = {
  parameters: comparison,
  render: () => (
    <Column>
      {VARIANTS.map((v) => (
        <TextField key={v} size={v} label={`size="${v}"`} />
      ))}
    </Column>
  ),
};

export const Required: Story = {
  args: { isRequired: true },
};

export const Invalid: Story = {
  args: { defaultValue: 'x', error: 'Name must be 2 characters or more' },
};

const ControlledTextField = () => {
  const [value, setValue] = useState('Ada');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '1rem' }}>
      <TextField label="Name" value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="button" onClick={() => setValue('')}>
        Clear
      </button>
      <output>value: {JSON.stringify(value)}</output>
    </div>
  );
};

/** `value` and `onChange` make the field controlled. The caller owns the text, so it can also set it. */
export const Controlled: Story = {
  parameters: showCode(`const [value, setValue] = useState('Ada');

<TextField label="Name" value={value} onChange={(e) => setValue(e.target.value)} />
<button onClick={() => setValue('')}>Clear</button>`),
  render: () => <ControlledTextField />,
};

const EmailField = () => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  return (
    <TextField
      label="Email"
      type="email"
      value={value}
      error={error}
      onChange={(e) => {
        setValue(e.target.value);
        if (error && e.target.validity.valid) setError(undefined);
      }}
      onBlur={(e) => setError(e.target.validity.valid ? undefined : 'Enter an email address')}
    />
  );
};

// Shows the pattern the error prop expects: validate when the user leaves the field, not on every
// keystroke, and clear the message as soon as the value is fixed
export const ValidateOnBlur: Story = {
  parameters: showCode(`const [value, setValue] = useState('');
const [error, setError] = useState<string>();

<TextField
  label="Email"
  type="email"
  value={value}
  error={error}
  onChange={(e) => {
    setValue(e.target.value);
    if (error && e.target.validity.valid) setError(undefined);
  }}
  onBlur={(e) => setError(e.target.validity.valid ? undefined : 'Enter an email address')}
/>`),
  render: () => <EmailField />,
};

/**
 * `isRevealable` on `type="password"` adds a button that shows the password as text and hides it again.
 * The input keeps focus when it is pressed. It is for the person typing, so leave it off where a
 * screen might be seen by others, or where the field is not a password the user chose.
 */
export const PasswordReveal: Story = {
  args: { type: 'password', label: 'Password', isRevealable: true, defaultValue: 'hunter2' },
};

/** The same two buttons at every size: the button and its icon follow `size`. */
export const PasswordRevealSizes: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: VARIANTS.map(
          (v) =>
            `<TextField size="${v}" type="password" isRevealable label="size=&quot;${v}&quot;" />`,
        ).join('\n\n'),
        transform: (code: string) => code,
      },
    },
  },
  render: () => (
    <Column>
      {VARIANTS.map((v) => (
        <TextField key={v} size={v} type="password" isRevealable label={`size="${v}"`} />
      ))}
    </Column>
  ),
};

/**
 * `type="number"` is the native input (spinbutton role, `min`, `max`, `step`, validity, mobile
 * keyboard), with its spin buttons hidden. The arrow keys step it. `onChange` gives the event as
 * always, so read `event.target.valueAsNumber`.
 */
export const NumberInput: Story = {
  args: { type: 'number', label: 'Quantity', min: 0, max: 10, defaultValue: 1 },
};

/**
 * `hasSteppers` adds − and + for the pointer. They step by `step` within `min` and `max`, are
 * disabled at the limit, and stay out of the tab order: the arrow keys on the input do the same.
 */
export const NumberSteppers: Story = {
  args: { type: 'number', label: 'Quantity', hasSteppers: true, min: 0, max: 10, defaultValue: 9 },
};

export const NumberStepsOfFive: Story = {
  args: {
    type: 'number',
    label: 'Seconds',
    hasSteppers: true,
    min: 0,
    max: 60,
    step: 5,
    defaultValue: 30,
  },
};

export const NumberInvalid: Story = {
  args: {
    type: 'number',
    label: 'Quantity',
    hasSteppers: true,
    defaultValue: 12,
    min: 0,
    max: 10,
    error: 'Choose 10 or fewer',
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'Ada Lovelace' },
};

export const ReadOnly: Story = {
  args: { isReadOnly: true, defaultValue: 'Ada Lovelace' },
};

export const EscapeHatch: Story = {
  argTypes: { size: textControl },
  args: { size: '1.5rem' },
};
