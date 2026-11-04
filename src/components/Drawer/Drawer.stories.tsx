import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { showCode } from '../../../.storybook/snippet';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Menu } from '../Menu';
import { Text } from '../Text';
import { TextField } from '../TextField';
import { Drawer, DRAWER_DEFAULTS } from './Drawer';

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '4rem 2rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof Drawer> = {
  title: 'Overlays/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: {
    ...DRAWER_DEFAULTS,
    title: 'Filters',
    trigger: <Button>Filters</Button>,
    children: (
      <>
        <Checkbox
          label="Status"
          options={[
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
        <TextField label="Assignee" />
      </>
    ),
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['start', 'end', 'top', 'bottom'] },
    trigger: { control: false },
    children: { control: false },
    actions: { control: false },
    isOpen: { control: false },
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
type Story = StoryObj<typeof Drawer>;

/**
 * Press the button. The panel slides in from the end edge; the page behind is dimmed and inert, and Tab
 * stays inside. Escape or a press on the backdrop closes it, and focus returns to the button.
 */
export const Default: Story = {};

/** `actions` sit at the bottom of the panel however short the content is. */
export const WithActions: Story = {
  parameters: {
    ...showCode(`const [isOpen, setIsOpen] = useState(false);

<Drawer
  title="Filters"
  trigger={<Button>Filters</Button>}
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  actions={
    <>
      <Button background="less" onClick={() => setIsOpen(false)}>Reset</Button>
      <Button onClick={() => setIsOpen(false)}>Apply</Button>
    </>
  }
>
  <TextField label="Assignee" />
</Drawer>`),
  },
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Drawer
        title="Filters"
        trigger={<Button>Filters</Button>}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        actions={
          <>
            <Button background="less" onClick={() => setIsOpen(false)}>
              Reset
            </Button>
            <Button onClick={() => setIsOpen(false)}>Apply</Button>
          </>
        }
      >
        <TextField label="Assignee" />
      </Drawer>
    );
  },
};

/** `placement` is the edge it is docked to. `start` and `end` swap sides in a right-to-left page. */
export const Placements: Story = {
  render: () => (
    <>
      {(['start', 'end', 'top', 'bottom'] as const).map((placement) => (
        <Drawer
          key={placement}
          title={`From the ${placement}`}
          placement={placement}
          trigger={<Button background="less">{placement}</Button>}
        >
          <Text as="p">Docked to the {placement} edge.</Text>
        </Drawer>
      ))}
    </>
  ),
};

/**
 * `isBackdropShown={false}` leaves the page as it is, with no veil and no blur, for a panel that
 * should sit over the content without hiding it. The page is still inert and a press on it still closes
 * the drawer; add `isBackdropClosing={false}` to keep it open.
 */
export const NoBackdrop: Story = {
  args: {
    title: 'Details',
    trigger: <Button>Details</Button>,
    isBackdropShown: false,
    children: <Text as="p">The page stays in view behind this panel.</Text>,
  },
};

/** Content past the height of the window scrolls inside the panel; the page behind it doesn’t. */
export const LongContent: Story = {
  args: {
    title: 'Release notes',
    trigger: <Button>Read the notes</Button>,
    children: (
      <>
        {Array.from({ length: 24 }, (_, index) => (
          <Text as="p" key={index}>
            Paragraph {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
        ))}
      </>
    ),
  },
};

/** With no `trigger`, it opens from state: here, from a menu item. Focus returns to the menu’s button. */
export const FromAMenu: Story = {
  parameters: {
    ...showCode(`const [isOpen, setIsOpen] = useState(false);

<Menu trigger={<Button>Actions</Button>} items={…} onSelect={() => setIsOpen(true)} />
<Drawer title="Details" isOpen={isOpen} onOpenChange={setIsOpen}>…</Drawer>`),
  },
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Menu
          trigger={<Button>Actions</Button>}
          items={[
            { value: 'details', label: 'Details' },
            { value: 'share', label: 'Share' },
          ]}
          onSelect={() => setIsOpen(true)}
        />
        <Drawer title="Details" isOpen={isOpen} onOpenChange={setIsOpen}>
          <Text as="p">Created by Sam, last changed yesterday.</Text>
        </Drawer>
      </>
    );
  },
};
