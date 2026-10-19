import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, BOX_DEFAULTS } from './Box';

const scaleControl = {
  control: 'select',
  options: [undefined, 'less', 'normal', 'more'],
} as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

// The variant stories render all three variants at once, so their controls would do nothing
const comparison = { controls: { disable: true } };

// Lays the variants out side by side without adding Box's own defaults to the demo
const Row = ({ alignItems, children }: { alignItems?: 'flex-start'; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems, gap: '1rem' }}>{children}</div>
);

// One Box per variant, each labelled with the prop it demonstrates
const Variants = ({ prop }: { prop: 'padding' | 'background' | 'borderRadius' | 'boxShadow' }) => (
  <Row alignItems="flex-start">
    {VARIANTS.map((v) => (
      <Box key={v} {...{ [prop]: v }}>
        {prop}="{v}"
      </Box>
    ))}
  </Row>
);

const meta: Meta<typeof Box> = {
  title: 'Primitives/Box',
  component: Box,
  tags: ['autodocs'],
  // Reflect the component's defaults in the controls and the Default column
  args: BOX_DEFAULTS,
  argTypes: {
    padding: scaleControl,
    margin: scaleControl,
    borderRadius: scaleControl,
    boxShadow: scaleControl,
    background: scaleControl,
  },
};
export default meta;
type Story = StoryObj<typeof Box>;

export const Default: Story = {
  args: { children: 'Box' },
};

export const Padding: Story = {
  parameters: comparison,
  render: () => <Variants prop="padding" />,
};

export const Background: Story = {
  parameters: comparison,
  render: () => <Variants prop="background" />,
};

export const BorderRadius: Story = {
  parameters: comparison,
  render: () => <Variants prop="borderRadius" />,
};

export const BoxShadow: Story = {
  parameters: comparison,
  render: () => <Variants prop="boxShadow" />,
};

export const EscapeHatch: Story = {
  args: {
    padding: '12px 24px',
    minWidth: 280,
    borderRadius: '50px',
    boxShadow: '0 8px 16px rgb(0 0 0 / 0.2)',
    background: 'linear-gradient(135deg, #fde68a, #fca5a5)',
    style: { textAlign: 'center' },
    children: 'Any CSS value, or a number for pixels',
  },
};
