import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Tooltip, TOOLTIP_DEFAULTS } from './Tooltip';

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '4rem 2rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof Tooltip> = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...TOOLTIP_DEFAULTS, content: 'Save the file', children: <Button>Save</Button> },
  parameters: {
    docs: { source: { transform: omitDefaults({ placement: TOOLTIP_DEFAULTS.placement }) } },
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom'] },
    delay: { control: 'number' },
    children: { control: false },
    content: { control: 'text' },
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
type Story = StoryObj<typeof Tooltip>;

/** Hover the button and rest on it, or Tab to it. Escape, leaving, or pressing it hides the tooltip. */
export const Default: Story = {};

export const Bottom: Story = {
  args: { placement: 'bottom' },
};

/** The tooltip flips to the other side when there is no room; place the trigger at the top edge to see it. */
export const Delayed: Story = {
  args: { delay: 400 },
};

/** It describes the trigger, it doesn't name it: an icon button still needs its own `aria-label`. */
export const OnAnything: Story = {
  parameters: showCode(`<Tooltip content="Ada Lovelace"><Avatar name="Ada Lovelace" /></Tooltip>`),
  render: () => (
    <Tooltip content="Ada Lovelace">
      <Avatar name="Ada Lovelace" />
    </Tooltip>
  ),
};
