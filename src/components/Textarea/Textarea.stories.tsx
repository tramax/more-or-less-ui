import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea, TEXTAREA_DEFAULTS } from './Textarea';

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

// The Size story renders all three variants at once, so its controls would do nothing. Its render
// returns <Column>, which Storybook can't turn into <Textarea> code, so spell the snippet out.
const comparison = {
  controls: { disable: true },
  docs: {
    source: {
      code: VARIANTS.map((v) => `<Textarea size="${v}" label="size=&quot;${v}&quot;" />`).join(
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

// Drop props that are at their default from the code snippet, so a bare `<Textarea>` shows as such
const omitDefaults = (code: string) =>
  Object.entries(TEXTAREA_DEFAULTS)
    .reduce(
      (c, [prop, value]) => c.replace(new RegExp(String.raw`\s+${prop}="${value}"`, 'g'), ''),
      code,
    )
    .replace(/<Textarea\s+\/>/g, '<Textarea />');

const meta: Meta<typeof Textarea> = {
  title: 'Inputs/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...TEXTAREA_DEFAULTS, label: 'Notes' },
  parameters: { docs: { source: { transform: omitDefaults } } },
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
      table: { defaultValue: { summary: TEXTAREA_DEFAULTS.size } },
    },
    rows: { control: 'number', table: { defaultValue: { summary: '3' } } },
    resize: {
      control: 'inline-radio',
      options: ['vertical', 'none'],
      table: { defaultValue: { summary: 'vertical' } },
    },
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: 'Anything we should know?' },
};

export const Size: Story = {
  parameters: comparison,
  render: () => (
    <Column>
      {VARIANTS.map((v) => (
        <Textarea key={v} size={v} label={`size="${v}"`} />
      ))}
    </Column>
  ),
};

export const Rows: Story = {
  args: { rows: 6 },
};

export const NoResize: Story = {
  args: { resize: 'none' },
};

export const Required: Story = {
  args: { isRequired: true },
};

export const Invalid: Story = {
  args: { defaultValue: 'x', error: 'Notes must be 10 characters or more' },
};

const NotesField = () => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  return (
    <Textarea
      label="Notes"
      isRequired
      value={value}
      error={error}
      onChange={(e) => {
        setValue(e.target.value);
        if (error && e.target.validity.valid) setError(undefined);
      }}
      onBlur={(e) => setError(e.target.validity.valid ? undefined : 'Add a note')}
    />
  );
};

// Shows the pattern the error prop expects: validate when the user leaves the field, not on every
// keystroke, and clear the message as soon as the value is fixed
export const ValidateOnBlur: Story = {
  parameters: { controls: { disable: true } },
  render: () => <NotesField />,
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'Ada Lovelace wrote the first program.' },
};

export const ReadOnly: Story = {
  args: { isReadOnly: true, defaultValue: 'Ada Lovelace wrote the first program.' },
};

export const EscapeHatch: Story = {
  argTypes: { size: textControl },
  args: { size: '1.5rem' },
};
