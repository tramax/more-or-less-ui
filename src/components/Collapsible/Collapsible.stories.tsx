import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Card } from '../Card';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Collapsible, COLLAPSIBLE_DEFAULTS } from './Collapsible';

// An icon draws with currentColor. The consumer brings their own icon library; this is only here to
// show the look.
const GEAR = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2M18 12h2M12 4v2M12 18v2" />
  </svg>
);

const BODY = (
  <Text>
    Orders placed before noon ship the same day. You can change the address until the parcel has
    left the warehouse, after which it can only be redirected from the carrier&apos;s page.
  </Text>
);

const meta: Meta<typeof Collapsible> = {
  title: 'Navigation/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: {
    ...COLLAPSIBLE_DEFAULTS,
    title: 'Shipping details',
    children: BODY,
  },
  parameters: { docs: { source: { transform: omitDefaults(COLLAPSIBLE_DEFAULTS) } } },
  decorators: [
    (Story) => (
      <div style={{ width: '28rem', maxWidth: '100%', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    // Storybook only reads defaults from destructuring, so state them for the Default column
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: COLLAPSIBLE_DEFAULTS.size } },
    },
    isOpen: { control: false },
    onOpenChange: { action: 'open changed' },
  },
};
export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {};

export const Open: Story = {
  args: { defaultIsOpen: true },
};

/** The icon is decorative: the title is still the button's name. */
export const WithIcon: Story = {
  args: { icon: GEAR, title: 'Advanced settings' },
};

/** It keeps its own state. Give it `isOpen` and `onOpenChange` instead when the parent needs to own it. */
export const Controlled: Story = {
  parameters: showCode(`const [isOpen, setIsOpen] = useState(false);

<Collapsible title="Shipping details" isOpen={isOpen} onOpenChange={setIsOpen}>…</Collapsible>`),
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapsible title="Shipping details" isOpen={isOpen} onOpenChange={setIsOpen}>
        {BODY}
      </Collapsible>
    );
  },
};

/** Not pressable, and as open or closed as it was. */
export const Disabled: Story = {
  args: { isDisabled: true },
};

export const Sizes: Story = {
  parameters: showCode(`<Collapsible size="less" title="Less" defaultIsOpen>…</Collapsible>
<Collapsible size="normal" title="Normal" defaultIsOpen>…</Collapsible>
<Collapsible size="more" title="More" defaultIsOpen>…</Collapsible>`),
  render: () => (
    <Stack gap="normal">
      {(['less', 'normal', 'more'] as const).map((size) => (
        <Collapsible key={size} size={size} title={`Size ${size}`} defaultIsOpen>
          {BODY}
        </Collapsible>
      ))}
    </Stack>
  ),
};

/** It has no surface of its own: put it in a Card for one. A list of them is a column in a Stack. */
export const InACard: Story = {
  parameters: showCode(`<Card>
  <Collapsible title="Shipping" defaultIsOpen>…</Collapsible>
</Card>`),
  render: () => (
    <Card>
      <Stack gap="less">
        {['Shipping', 'Returns', 'Warranty'].map((title, index) => (
          <Collapsible key={title} title={title} defaultIsOpen={index === 0}>
            {BODY}
          </Collapsible>
        ))}
      </Stack>
    </Card>
  ),
};
