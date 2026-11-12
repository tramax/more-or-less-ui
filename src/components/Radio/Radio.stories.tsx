import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { showCode, withoutActions } from '../../../.storybook/snippet';
import { Radio, type RadioOption } from './Radio';

const OPTIONS: RadioOption[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'Text message' },
  { value: 'push', label: 'Push notification' },
  { value: 'post', label: 'Post' },
];

const WITH_DESCRIPTIONS: RadioOption[] = [
  { value: 'email', label: 'Email', description: 'Receipts and account activity' },
  { value: 'sms', label: 'Text message', description: 'Only for security codes' },
  { value: 'push', label: 'Push notification', description: 'On the devices you are signed in to' },
];

const meta: Meta<typeof Radio> = {
  title: 'Inputs/Radio',
  component: Radio,
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
type Story = StoryObj<typeof Radio>;

export const Default: Story = {};

export const WithTooltip: Story = {
  args: { tooltip: 'We only use this to tell you about your orders.' },
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
};

export const WithDescriptions: Story = {
  args: { options: WITH_DESCRIPTIONS, defaultValue: 'email' },
};

export const Required: Story = {
  args: { isRequired: true },
};

// `null` is controlled with nothing selected; the button is the only way to clear a radio
const ControlledGroup = (args: ComponentProps<typeof Radio>) => {
  const [value, setValue] = useState<string | null>('sms');
  return (
    <div style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
      <Radio
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange?.(next);
        }}
      />
      <button type="button" onClick={() => setValue(null)}>
        Clear
      </button>
    </div>
  );
};

export const Controlled: Story = {
  parameters: showCode(
    `const [value, setValue] = useState<string | null>('sms');

<Radio label="Contact me by" options={options} value={value} onChange={setValue} />
<button onClick={() => setValue(null)}>Clear</button>`,
    { hasControls: true },
  ),
  render: (args) => <ControlledGroup {...args} />,
};

// The component only displays `error`; the caller decides when. Here the message shows while
// nothing is selected and clears as soon as something is.
const InvalidGroup = (args: ComponentProps<typeof Radio>) => {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Radio
      {...args}
      value={value}
      error={value === null ? args.error : undefined}
      onChange={(next) => {
        setValue(next);
        args.onChange?.(next);
      }}
    />
  );
};

export const Invalid: Story = {
  parameters: showCode(
    `const [value, setValue] = useState<string | null>(null);

<Radio
  label="Contact me by"
  options={options}
  isRequired
  value={value}
  error={value === null ? 'Choose a way to contact you' : undefined}
  onChange={setValue}
/>`,
    { hasControls: true },
  ),
  args: { error: 'Choose a way to contact you', isRequired: true },
  render: (args) => <InvalidGroup {...args} />,
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'email' },
};

export const DisabledOption: Story = {
  args: {
    options: [
      OPTIONS[0] as RadioOption,
      { ...(OPTIONS[1] as RadioOption), isDisabled: true },
      { ...(OPTIONS[2] as RadioOption), isDisabled: true },
      OPTIONS[3] as RadioOption,
    ],
    defaultValue: 'push',
  },
};
