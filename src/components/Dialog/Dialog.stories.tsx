import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Button } from '../Button';
import { Menu } from '../Menu';
import { Select } from '../Select';
import { Text } from '../Text';
import { TextField } from '../TextField';
import { Dialog, DIALOG_DEFAULTS } from './Dialog';

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '4rem 2rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof Dialog> = {
  title: 'Overlays/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: {
    ...DIALOG_DEFAULTS,
    title: 'Rename file',
    trigger: <Button>Rename</Button>,
    children: <Text as="p">The new name is shown to everyone who can open the file.</Text>,
  },
  parameters: {
    docs: { source: { transform: omitDefaults({ role: DIALOG_DEFAULTS.role }) } },
  },
  argTypes: {
    role: { control: 'inline-radio', options: ['dialog', 'alertdialog'] },
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
type Story = StoryObj<typeof Dialog>;

/**
 * Press the button. The page behind is dimmed and inert, and Tab stays inside. Escape or a press on
 * the backdrop closes it, and focus returns to the button.
 */
export const Default: Story = {};

/** `actions` is the row under the content, end-aligned. */
export const WithActions: Story = {
  parameters: {
    ...showCode(`const [isOpen, setIsOpen] = useState(false);

<Dialog
  title="Rename file"
  trigger={<Button>Rename</Button>}
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  actions={
    <>
      <Button background="less" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={() => setIsOpen(false)}>Save</Button>
    </>
  }
>
  <TextField label="Name" defaultValue="Quarterly report" />
</Dialog>`),
  },
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Dialog
        title="Rename file"
        trigger={<Button>Rename</Button>}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        actions={
          <>
            <Button background="less" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Save</Button>
          </>
        }
      >
        <TextField label="Name" defaultValue="Quarterly report" />
      </Dialog>
    );
  },
};

/**
 * A confirmation. An `alertdialog` is described, and a press on the backdrop doesn’t answer it.
 * Focus starts on Cancel (`autoFocus`), the safe answer, not the first button in the row.
 */
export const Alert: Story = {
  parameters: {
    ...showCode(`<Dialog
  title="Delete file?"
  role="alertdialog"
  aria-describedby="delete-why"
  trigger={<Button>Delete</Button>}
  actions={…}
>
  <Text as="p" id="delete-why">This can’t be undone.</Text>
</Dialog>`),
  },
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Dialog
        title="Delete file?"
        role="alertdialog"
        aria-describedby="delete-why"
        trigger={<Button>Delete</Button>}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        actions={
          <>
            <Button background="less" autoFocus onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Delete</Button>
          </>
        }
      >
        <Text as="p" id="delete-why">
          This can’t be undone.
        </Text>
      </Dialog>
    );
  },
};

/** Content past the height of the window scrolls inside the dialog; the page behind it doesn’t. */
export const LongContent: Story = {
  args: {
    title: 'Terms of service',
    trigger: <Button>Read the terms</Button>,
    children: (
      <>
        {Array.from({ length: 12 }, (_, index) => (
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
<Dialog title="Rename file" isOpen={isOpen} onOpenChange={setIsOpen}>…</Dialog>`),
  },
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Menu
          trigger={<Button>Actions</Button>}
          items={[
            { value: 'rename', label: 'Rename' },
            { value: 'delete', label: 'Delete' },
          ]}
          onSelect={() => setIsOpen(true)}
        />
        <Dialog title="Rename file" isOpen={isOpen} onOpenChange={setIsOpen}>
          <TextField label="Name" />
        </Dialog>
      </>
    );
  },
};

/** A Select’s popup and a Menu open above the dialog; Escape closes them first, then the dialog. */
export const WithOverlaysInside: Story = {
  args: {
    title: 'Invite someone',
    trigger: <Button>Invite</Button>,
    children: (
      <>
        <TextField label="Email" type="email" />
        <Select
          label="Role"
          options={[
            { value: 'viewer', label: 'Viewer' },
            { value: 'editor', label: 'Editor' },
          ]}
        />
        <Menu
          trigger={<Button>More</Button>}
          items={[{ value: 'copy', label: 'Copy link' }]}
          onSelect={() => {}}
        />
      </>
    ),
  },
};
