import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Inputs/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  args: { label: 'Dark mode' },
  decorators: [
    (Story) => (
      <div style={{ width: '28rem', maxWidth: '100%', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {};

export const On: Story = {
  args: { defaultChecked: true },
};

export const WithDescription: Story = {
  args: { description: 'Follows your system setting until you change it' },
};

// The visible label is optional: name it with aria-label instead
export const WithoutLabel: Story = {
  args: { label: undefined, 'aria-label': 'Dark mode' } as never,
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const DisabledOn: Story = {
  args: { isDisabled: true, defaultChecked: true },
};

// A settings list is several Toggles; each applies as soon as it is flipped
export const SettingsList: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <Toggle
        label="Email notifications"
        description="Receipts and account activity"
        defaultChecked
      />
      <Toggle label="Push notifications" description="On the devices you are signed in to" />
      <Toggle label="Weekly summary" defaultChecked />
      <Toggle label="Beta features" isDisabled />
    </div>
  ),
};
