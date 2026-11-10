import { useState, type ComponentProps, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { asControlled, showCode } from '../../../.storybook/snippet';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Tabs, TABS_DEFAULTS, type TabItem } from './Tabs';

// Icons draw with currentColor, so the selected tab's accent colors them. The consumer brings their own
// icon library; these are only here to show the look.
const icon = (path: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);
const HOME = icon('M4 11l8-7 8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z');
const SEARCH = icon('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4');
const TRIPS = icon('M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z');
const SAVED = icon('M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z');
const PROFILE = icon('M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20a8 8 0 0 1 16 0');

const ITEMS: TabItem[] = [
  {
    value: 'account',
    label: 'Account',
    content: <Text>Your name, email and password.</Text>,
  },
  {
    value: 'billing',
    label: 'Billing',
    content: <Text>Your plan, invoices and payment method.</Text>,
  },
  {
    value: 'team',
    label: 'Team',
    content: <Text>People who share this workspace.</Text>,
    isDisabled: true,
  },
  {
    value: 'security',
    label: 'Security',
    content: <Text>Two-step sign-in and active sessions.</Text>,
  },
];

// The parent owns the selection, so every story needs one. The `value` arg is where it starts.
const Stateful = ({ value: initial, onChange, ...args }: ComponentProps<typeof Tabs>) => {
  const [value, setValue] = useState(initial);
  return (
    <Tabs
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

const meta: Meta<typeof Tabs> = {
  title: 'Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...TABS_DEFAULTS, items: ITEMS, value: 'account', 'aria-label': 'Settings' },
  render: (args) => <Stateful {...args} />,
  parameters: {
    docs: {
      source: {
        transform: asControlled(TABS_DEFAULTS, { as: 'Tabs', prop: 'value', setter: 'setValue' }),
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '32rem', maxWidth: '100%', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    // Storybook only reads defaults from destructuring, so state them for the Default column
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: TABS_DEFAULTS.size } },
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'horizontal' } },
    },
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {};

/** The tabs beside the panel, moved with ↑ ↓. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
};

const NAV: TabItem[] = [
  { value: 'home', label: 'Home', icon: HOME, content: <Text>Where you left off.</Text> },
  { value: 'search', label: 'Search', icon: SEARCH, content: <Text>Find a place to go.</Text> },
  { value: 'trips', label: 'Trips', icon: TRIPS, content: <Text>Your bookings.</Text> },
  { value: 'saved', label: 'Saved', icon: SAVED, content: <Text>Places you liked.</Text> },
  { value: 'profile', label: 'Profile', icon: PROFILE, content: <Text>Your details.</Text> },
];

/** An icon sits above the label and is decorative: the label is still the tab's name. */
export const WithIcons: Story = {
  args: { items: NAV, value: 'home', 'aria-label': 'Main' },
};

export const Sizes: Story = {
  parameters: showCode(`<Tabs size="less" items={items} value={value} onChange={setValue} />
<Tabs size="normal" items={items} value={value} onChange={setValue} />
<Tabs size="more" items={items} value={value} onChange={setValue} />`),
  render: () => (
    <Stack gap="more">
      {(['less', 'normal', 'more'] as const).map((size) => (
        <Stateful
          key={size}
          size={size}
          items={ITEMS}
          value="account"
          onChange={() => {}}
          aria-label={`Settings, ${size}`}
        />
      ))}
    </Stack>
  ),
};

// Enough text to scroll under the tray, which is what the blur is for
const LONG = (what: string): ReactNode => (
  <Stack gap="normal">
    {Array.from({ length: 10 }, (_, index) => (
      <Text key={index}>
        {what}: paragraph {index + 1}. Scroll this box and the tabs stay where they are, with the
        text passing under them. The tray is frosted, so the lines show through it, blurred.
      </Text>
    ))}
  </Stack>
);

const STICKY_ITEMS: TabItem[] = [
  { value: 'overview', label: 'Overview', content: LONG('Overview') },
  { value: 'specs', label: 'Specs', content: LONG('Specs') },
  { value: 'reviews', label: 'Reviews', content: LONG('Reviews') },
];

/**
 * `isSticky` keeps the tabs in view while the panel scrolls under them, and lets go once the panel has
 * scrolled past. It needs a scrolling ancestor with no `overflow` in between (an `overflow: hidden`
 * parent stops `position: sticky`). The gap to the top edge is `--tabs-sticky-top` on the Tabs.
 */
export const Sticky: Story = {
  parameters: showCode(
    `<Tabs isSticky items={items} value={value} onChange={setValue} aria-label="Product" />`,
  ),
  render: () => (
    <div style={{ height: '24rem', overflow: 'auto', padding: '1rem' }}>
      <Stack gap="normal">
        <Text as="h2" size="more">
          Trail jacket
        </Text>
        <Text>Scroll the box. The tabs stay at the top.</Text>
        <Stateful
          isSticky
          items={STICKY_ITEMS}
          value="overview"
          onChange={() => {}}
          aria-label="Product"
        />
      </Stack>
    </div>
  ),
};
