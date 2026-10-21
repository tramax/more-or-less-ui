import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
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

// Drop props that are at their default from the code snippet, so a bare `<TextField>` shows as such
const omitDefaults = (code: string) =>
  Object.entries(TEXTFIELD_DEFAULTS)
    .reduce(
      (c, [prop, value]) => c.replace(new RegExp(String.raw`\s+${prop}="${value}"`, 'g'), ''),
      code,
    )
    .replace(/<TextField\s+\/>/g, '<TextField />');

const meta: Meta<typeof TextField> = {
  title: 'Forms/TextField',
  component: TextField,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...TEXTFIELD_DEFAULTS, label: 'Name' },
  parameters: { docs: { source: { transform: omitDefaults } } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '24rem', padding: '1rem' }}>
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
      options: ['text', 'email', 'password', 'search', 'tel', 'url'],
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
  parameters: { controls: { disable: true } },
  render: () => <EmailField />,
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
