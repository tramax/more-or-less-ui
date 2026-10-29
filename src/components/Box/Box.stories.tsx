import type { Meta, StoryObj } from '@storybook/react-vite';
import { withoutActions } from '../../../.storybook/snippet';
import { Box } from './Box';

const spaceControl = { control: 'select', options: ['less', 'normal', 'more'] } as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const meta: Meta<typeof Box> = {
  title: 'Layout and surfaces/Box',
  component: Box,
  tags: ['autodocs'],
  parameters: { docs: { source: { transform: withoutActions } } },
  argTypes: {
    padding: spaceControl,
    paddingLeft: spaceControl,
    paddingRight: spaceControl,
    paddingTop: spaceControl,
    paddingBottom: spaceControl,
    margin: spaceControl,
    marginLeft: spaceControl,
    marginRight: spaceControl,
    marginTop: spaceControl,
    marginBottom: spaceControl,
  },
};
export default meta;
type Story = StoryObj<typeof Box>;

// Box paints nothing, so the outline in the demos is only there to show where its space is
const outline = { outline: '1px dashed currentColor' };

export const Default: Story = {
  args: { padding: 'normal', style: outline, children: 'Box adds space and nothing else' },
};

export const Margin: Story = {
  args: { margin: 'normal', style: outline, children: 'margin="normal"' },
};

export const PerSide: Story = {
  args: { paddingLeft: 'more', paddingTop: 'less', style: outline, children: 'Per-side props' },
};

export const EscapeHatch: Story = {
  argTypes: { padding: textControl, margin: textControl },
  args: {
    padding: '12px 24px',
    margin: '1.5rem',
    style: outline,
    children: 'Any CSS value, or a number for pixels',
  },
};
