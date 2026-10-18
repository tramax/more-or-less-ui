import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from './Box';

const scaleControl = {
  control: 'select',
  options: [undefined, 'less', 'normal', 'more'],
} as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

// Lays the variants out side by side without adding Box's own defaults to the demo
const Row = ({ alignItems, children }: { alignItems?: 'flex-start'; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems, gap: '1rem' }}>{children}</div>
);

const meta: Meta<typeof Box> = {
  title: 'Primitives/Box',
  component: Box,
  tags: ['autodocs'],
  argTypes: {
    padding: scaleControl,
    margin: scaleControl,
    gap: scaleControl,
    width: scaleControl,
    height: scaleControl,
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
  render: () => (
    <Row alignItems="flex-start">
      {VARIANTS.map((v) => (
        <Box key={v} padding={v}>
          padding="{v}"
        </Box>
      ))}
    </Row>
  ),
};

export const Background: Story = {
  render: () => (
    <Row>
      {VARIANTS.map((v) => (
        <Box key={v} background={v} />
      ))}
    </Row>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <Row>
      {VARIANTS.map((v) => (
        <Box key={v} borderRadius={v} />
      ))}
    </Row>
  ),
};

export const BoxShadow: Story = {
  render: () => (
    <Row>
      {VARIANTS.map((v) => (
        <Box key={v} boxShadow={v} />
      ))}
    </Row>
  ),
};

export const Layout: Story = {
  render: () => (
    <Box display="flex" flexDirection="column" gap="less" background="less">
      <Box />
      <Box />
      <Box />
    </Box>
  ),
};

export const EscapeHatch: Story = {
  args: {
    padding: '12px 24px',
    width: 280,
    borderRadius: '50px',
    boxShadow: '0 8px 16px rgb(0 0 0 / 0.2)',
    background: 'linear-gradient(135deg, #fde68a, #fca5a5)',
    style: { textAlign: 'center' },
    children: 'Any CSS value, or a number for pixels',
  },
};
