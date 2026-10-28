import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { showCode, withoutActions } from '../../../.storybook/snippet';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Inputs/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: { docs: { source: { transform: withoutActions } } },
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

const ControlledToggle = () => {
  const [checked, setChecked] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '1rem' }}>
      <Toggle label="Dark mode" checked={checked} onChange={setChecked} />
      <button type="button" onClick={() => setChecked(!checked)}>
        Flip from outside
      </button>
      <output>checked: {String(checked)}</output>
    </div>
  );
};

/** `checked` and `onChange` make the toggle controlled: it shows `checked`, and the caller can flip it too. */
export const Controlled: Story = {
  parameters: showCode(`const [checked, setChecked] = useState(true);

<Toggle label="Dark mode" checked={checked} onChange={setChecked} />
<button onClick={() => setChecked(!checked)}>Flip from outside</button>`),
  render: () => <ControlledToggle />,
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
  parameters: showCode(`<div style={{ display: 'grid', gap: '0.75rem' }}>
  <Toggle
    label="Email notifications"
    description="Receipts and account activity"
    defaultChecked
  />
  <Toggle label="Push notifications" description="On the devices you are signed in to" />
  <Toggle label="Weekly summary" defaultChecked />
  <Toggle label="Beta features" isDisabled />
</div>`),
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
