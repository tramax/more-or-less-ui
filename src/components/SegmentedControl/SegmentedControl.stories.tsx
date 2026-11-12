import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Stack } from '../Stack';
import { Text } from '../Text';
import {
  SegmentedControl,
  SEGMENTED_CONTROL_DEFAULTS,
  type SegmentOption,
} from './SegmentedControl';

// Icons draw with currentColor, so the selected segment's text color colors them. The consumer brings
// their own icon library; these are only here to show the look.
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
const LIST = icon('M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01');
const GRID = icon('M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z');

const FILTERS: SegmentOption[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'starred', label: 'Starred' },
];

const meta: Meta<typeof SegmentedControl> = {
  title: 'Inputs/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...SEGMENTED_CONTROL_DEFAULTS, label: 'Show', options: FILTERS, defaultValue: 'all' },
  parameters: { docs: { source: { transform: omitDefaults(SEGMENTED_CONTROL_DEFAULTS) } } },
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
      table: { defaultValue: { summary: SEGMENTED_CONTROL_DEFAULTS.size } },
    },
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {};

export const WithTooltip: Story = {
  args: { tooltip: 'Changes which items the list below shows.' },
};

/** With nothing selected there is no thumb; the first arrow key or click chooses. */
export const NothingSelected: Story = {
  args: { defaultValue: undefined },
};

/** An icon sits before the label and is decorative: the label is still the segment's name. */
export const WithIcons: Story = {
  args: {
    label: 'View',
    options: [
      { value: 'list', label: 'List', icon: LIST },
      { value: 'grid', label: 'Grid', icon: GRID },
    ],
    defaultValue: 'list',
  },
};

export const Sizes: Story = {
  parameters: showCode(`<SegmentedControl size="less" label="Show" options={options} />
<SegmentedControl size="normal" label="Show" options={options} />
<SegmentedControl size="more" label="Show" options={options} />`),
  render: () => (
    <Stack gap="more">
      {(['less', 'normal', 'more'] as const).map((size) => (
        <SegmentedControl
          key={size}
          size={size}
          label={`Show, ${size}`}
          options={FILTERS}
          defaultValue="all"
        />
      ))}
    </Stack>
  ),
};

const MESSAGES = [
  { id: 1, subject: 'Welcome aboard', unread: false, starred: true },
  { id: 2, subject: 'Your invoice is ready', unread: true, starred: false },
  { id: 3, subject: 'Trip to Hanoi', unread: true, starred: true },
  { id: 4, subject: 'Weekly digest', unread: false, starred: false },
];

// The page, not the control, owns the filter: the list follows it, and the count is announced
const QuickFilter = (args: ComponentProps<typeof SegmentedControl>) => {
  const [filter, setFilter] = useState('all');
  const shown = MESSAGES.filter(
    (m) => filter === 'all' || (filter === 'unread' ? m.unread : m.starred),
  );
  return (
    <Stack gap="normal">
      <SegmentedControl
        {...args}
        value={filter}
        onChange={(next) => {
          setFilter(next);
          args.onChange?.(next);
        }}
      />
      <div role="status">
        <Text size="less">{shown.length} messages</Text>
      </div>
      <ul style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
        {shown.map((m) => (
          <li key={m.id}>
            <Text>{m.subject}</Text>
          </li>
        ))}
      </ul>
    </Stack>
  );
};

/**
 * The use it is for: a quick filter that narrows one list. The control only holds the value; the page
 * filters, and announces the new count in a live region (the control does not know what it filters).
 */
export const AsQuickFilter: Story = {
  parameters: showCode(
    `const [filter, setFilter] = useState('all');

<SegmentedControl label="Show" options={options} value={filter} onChange={setFilter} />
<div role="status">{shown.length} messages</div>`,
    { hasControls: true },
  ),
  render: (args) => <QuickFilter {...args} />,
};

// The component only displays `error`; the caller decides when
const InvalidControl = (args: ComponentProps<typeof SegmentedControl>) => {
  const [value, setValue] = useState<string | null>(null);
  return (
    <SegmentedControl
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

<SegmentedControl
  label="Billing"
  options={options}
  isRequired
  value={value}
  error={value === null ? 'Choose how often you pay' : undefined}
  onChange={setValue}
/>`,
    { hasControls: true },
  ),
  args: {
    label: 'Billing',
    options: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
    ],
    defaultValue: undefined,
    error: 'Choose how often you pay',
    isRequired: true,
  },
  render: (args) => <InvalidControl {...args} />,
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const DisabledOption: Story = {
  args: {
    options: [
      FILTERS[0] as SegmentOption,
      FILTERS[1] as SegmentOption,
      { ...(FILTERS[2] as SegmentOption), isDisabled: true },
    ],
  },
};
