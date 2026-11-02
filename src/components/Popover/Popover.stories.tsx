import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Button } from '../Button';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { TextField } from '../TextField';
import { Popover, POPOVER_DEFAULTS } from './Popover';

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '4rem 2rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof Popover> = {
  title: 'Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: {
    ...POPOVER_DEFAULTS,
    'aria-label': 'Share',
    trigger: <Button>Share</Button>,
    children: <Text as="p">Anyone with the link can view.</Text>,
  },
  parameters: {
    docs: {
      source: {
        transform: omitDefaults({
          placement: POPOVER_DEFAULTS.placement,
          align: POPOVER_DEFAULTS.align,
        }),
      },
    },
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    trigger: { control: false },
    children: { control: false },
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
type Story = StoryObj<typeof Popover>;

/**
 * Press the button. Escape, a press or Tab outside, or the button again closes it; closing it from
 * inside returns focus to the button.
 */
export const Default: Story = {};

export const Top: Story = {
  args: { placement: 'top' },
};

/** `start` lines the panel's start edge up with the trigger's; `end` lines the end edges up. */
export const Aligned: Story = {
  parameters: {
    ...showCode(`<Popover trigger={<Button>Start</Button>} align="start" aria-label="Start">…</Popover>
<Popover trigger={<Button>End</Button>} align="end" aria-label="End">…</Popover>`),
  },
  render: () => (
    <>
      <Popover trigger={<Button>Start</Button>} align="start" aria-label="Aligned to the start">
        <Text as="p">Its start edge is on the button’s start edge.</Text>
      </Popover>
      <Popover trigger={<Button>End</Button>} align="end" aria-label="Aligned to the end">
        <Text as="p">Its end edge is on the button’s end edge.</Text>
      </Popover>
    </>
  ),
};

/** It holds anything, and it is not modal: the page behind it stays live. */
export const WithForm: Story = {
  args: {
    'aria-label': 'Invite someone',
    trigger: <Button>Invite</Button>,
    children: (
      <Stack gap="normal">
        <TextField label="Email" type="email" />
        <Button>Send invite</Button>
      </Stack>
    ),
  },
};

/** Controlled: the caller owns the state, and the content can close it. */
export const Controlled: Story = {
  parameters: {
    ...showCode(`const [isOpen, setIsOpen] = useState(false);

<Popover
  aria-label="Delete file"
  trigger={<Button>Delete</Button>}
  isOpen={isOpen}
  onOpenChange={setIsOpen}
>
  <Button onClick={() => setIsOpen(false)}>Done</Button>
</Popover>`),
  },
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Popover
        aria-label="Delete file"
        trigger={<Button>Delete</Button>}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Button onClick={() => setIsOpen(false)}>Done</Button>
      </Popover>
    );
  },
};
