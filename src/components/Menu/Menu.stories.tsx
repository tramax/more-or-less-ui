import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Button } from '../Button';
import { Text } from '../Text';
import { Menu, MENU_DEFAULTS, type MenuItem } from './Menu';

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '4rem 2rem' }}>
    {children}
  </div>
);

const ITEMS: MenuItem[] = [
  { value: 'rename', label: 'Rename' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'move', label: 'Move to…' },
  { value: 'delete', label: 'Delete' },
];

const meta: Meta<typeof Menu> = {
  title: 'Overlays/Menu',
  component: Menu,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: {
    ...MENU_DEFAULTS,
    trigger: <Button>Actions</Button>,
    items: ITEMS,
  },
  parameters: {
    docs: {
      source: {
        transform: omitDefaults({
          placement: MENU_DEFAULTS.placement,
          align: MENU_DEFAULTS.align,
        }),
      },
    },
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    trigger: { control: false },
    items: { control: false },
    isOpen: { control: false },
    onSelect: { action: 'selected' },
    onOpenChange: { control: false },
  },
  decorators: [
    (Story) => (
      <Row>
        <Story />
      </Row>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Menu>;

/**
 * Press the button, or focus it and press ↓ (↑ opens on the last item). Arrow keys, Home, End and
 * typing move through the items; Enter or Space chooses, Escape closes and returns to the button.
 */
export const Default: Story = {};

export const Top: Story = {
  args: { placement: 'top' },
};

/** `start` lines the menu's start edge up with the trigger's; `end` lines the end edges up. */
export const Aligned: Story = {
  parameters: {
    ...showCode(`<Menu trigger={<Button>Start</Button>} items={items} onSelect={…} align="start" />
<Menu trigger={<Button>End</Button>} items={items} onSelect={…} align="end" />`),
  },
  render: () => (
    <>
      <Menu trigger={<Button>Start</Button>} items={ITEMS} onSelect={() => {}} align="start" />
      <Menu trigger={<Button>End</Button>} items={ITEMS} onSelect={() => {}} align="end" />
    </>
  ),
};

const Glyph = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d={d} />
  </svg>
);

/** An item takes a `description` under its label and an `icon` before it, as a Select option does. */
export const WithIconsAndDescriptions: Story = {
  args: {
    items: [
      { value: 'rename', label: 'Rename', icon: <Glyph d="M3 13l1-3 7-7 2 2-7 7z" /> },
      {
        value: 'duplicate',
        label: 'Duplicate',
        description: 'Make a copy in this folder',
        icon: <Glyph d="M5 5h8v8H5zM3 11V3h8" />,
      },
      {
        value: 'delete',
        label: 'Delete',
        description: 'Gone for good',
        icon: <Glyph d="M3 5h10M6 5V3h4v2M5 5l1 8h4l1-8" />,
      },
    ],
  },
};

/** A disabled item is dimmed, can't be chosen, and the arrow keys step over it. */
export const DisabledItem: Story = {
  args: {
    items: [
      { value: 'rename', label: 'Rename' },
      { value: 'move', label: 'Move to…', isDisabled: true },
      { value: 'delete', label: 'Delete' },
    ],
  },
};

/** An icon-only trigger still needs a name: the menu is named by it. */
export const IconTrigger: Story = {
  args: {
    trigger: <Button aria-label="More actions" icon={<Glyph d="M3 8h.01M8 8h.01M13 8h.01" />} />,
    align: 'end',
  },
};

/** `onSelect` gets the value; the caller does the work. */
export const Choosing: Story = {
  parameters: {
    ...showCode(`const [last, setLast] = useState<string>();

<Menu trigger={<Button>Actions</Button>} items={items} onSelect={setLast} />
<Text>Last chosen: {last ?? 'nothing'}</Text>`),
  },
  render: function Render() {
    const [last, setLast] = useState<string>();
    return (
      <>
        <Menu trigger={<Button>Actions</Button>} items={ITEMS} onSelect={setLast} />
        <Text>Last chosen: {last ?? 'nothing'}</Text>
      </>
    );
  },
};

/** Controlled: the caller owns the state. */
export const Controlled: Story = {
  parameters: {
    ...showCode(`const [isOpen, setIsOpen] = useState(false);

<Menu
  trigger={<Button>Actions</Button>}
  items={items}
  onSelect={…}
  isOpen={isOpen}
  onOpenChange={setIsOpen}
/>`),
  },
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Menu
        trigger={<Button>Actions</Button>}
        items={ITEMS}
        onSelect={() => {}}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    );
  },
};
