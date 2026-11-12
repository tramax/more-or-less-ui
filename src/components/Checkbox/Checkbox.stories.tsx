import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { showCode, withoutActions } from '../../../.storybook/snippet';
import { Checkbox, type CheckboxOption } from './Checkbox';

const OPTIONS: CheckboxOption[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'Text message' },
  { value: 'push', label: 'Push notification' },
  { value: 'post', label: 'Post' },
];

const WITH_DESCRIPTIONS: CheckboxOption[] = [
  { value: 'email', label: 'Email', description: 'Receipts and account activity' },
  { value: 'sms', label: 'Text message', description: 'Only for security codes' },
  { value: 'push', label: 'Push notification', description: 'On the devices you are signed in to' },
];

const meta: Meta<typeof Checkbox> = {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { docs: { source: { transform: withoutActions } } },
  args: { label: 'Contact me by', options: OPTIONS },
  decorators: [
    (Story) => (
      <div style={{ width: '28rem', maxWidth: '100%', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal'],
      table: { defaultValue: { summary: 'vertical' } },
    },
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
};

export const WithDescriptions: Story = {
  args: { options: WITH_DESCRIPTIONS, defaultValue: ['email'] },
};

// The limits are enforced, not announced: the label says what they are
export const WithTooltip: Story = {
  args: { tooltip: 'We only use these to tell you about your orders.' },
};

export const MaxChecked: Story = {
  args: { label: 'Pick up to 2', maxChecked: 2, defaultValue: ['email'] },
};

export const MinChecked: Story = {
  args: { label: 'Keep at least 1', minChecked: 1, defaultValue: ['email'] },
};

export const MinAndMax: Story = {
  args: { label: 'Pick 1 or 2', minChecked: 1, maxChecked: 2, defaultValue: ['email'] },
};

// `[]` is controlled with nothing checked; the button is the only way to clear them all at once
const ControlledGroup = (args: ComponentProps<typeof Checkbox>) => {
  const [value, setValue] = useState<string[]>(['email', 'sms']);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '1rem' }}>
      <Checkbox
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange?.(next);
        }}
      />
      <button type="button" onClick={() => setValue([])}>
        Clear
      </button>
      <output>value: {JSON.stringify(value)}</output>
    </div>
  );
};

export const Controlled: Story = {
  parameters: showCode(
    `const [value, setValue] = useState<string[]>(['email', 'sms']);

<Checkbox label="Contact me by" options={options} value={value} onChange={setValue} />
<button onClick={() => setValue([])}>Clear</button>`,
    { hasControls: true },
  ),
  render: (args) => <ControlledGroup {...args} />,
};

// The component only displays `error`; the caller decides when. Here the message shows while
// nothing is checked and clears as soon as something is. No minChecked: it would stop the last
// option being unchecked, so the error could never come back.
const InvalidGroup = (args: ComponentProps<typeof Checkbox>) => {
  const [value, setValue] = useState<string[]>([]);
  return (
    <Checkbox
      {...args}
      value={value}
      error={value.length === 0 ? args.error : undefined}
      onChange={(next) => {
        setValue(next);
        args.onChange?.(next);
      }}
    />
  );
};

export const Invalid: Story = {
  parameters: showCode(
    `const [value, setValue] = useState<string[]>([]);

<Checkbox
  label="Contact me by"
  options={options}
  value={value}
  error={value.length === 0 ? 'Choose at least one way to contact you' : undefined}
  onChange={setValue}
/>`,
    { hasControls: true },
  ),
  args: { error: 'Choose at least one way to contact you' },
  render: (args) => <InvalidGroup {...args} />,
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: ['email', 'push'] },
};

export const DisabledOption: Story = {
  args: {
    options: [
      OPTIONS[0] as CheckboxOption,
      { ...(OPTIONS[1] as CheckboxOption), isDisabled: true },
      { ...(OPTIONS[2] as CheckboxOption), isDisabled: true },
      OPTIONS[3] as CheckboxOption,
    ],
    defaultValue: ['push'],
  },
};
