import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Box } from './Box';

const scaleControl = {
  control: 'select',
  options: [undefined, 'less', 'normal', 'more'],
} as const;

const meta: Meta<typeof Box> = {
  title: 'Primitives/Box',
  component: Box,
  tags: ['autodocs'],
  argTypes: {
    size: scaleControl,
    padding: scaleControl,
    margin: scaleControl,
    gap: scaleControl,
    width: scaleControl,
    height: scaleControl,
    borderRadius: scaleControl,
    boxShadow: scaleControl,
  },
};
export default meta;
type Story = StoryObj<typeof Box>;

// Box has no look of its own; give the stories something to see
const surface: CSSProperties = {
  background: 'var(--color-bg-secondary)',
  border: '1px dashed var(--color-border-strong)',
  color: 'var(--color-text-primary)',
};

const Chip = () => (
  <div style={{ background: 'var(--color-primary-500)', width: '2rem', height: '2rem' }} />
);

export const Default: Story = {
  args: { padding: 'normal', borderRadius: 'normal', style: surface, children: 'Box' },
};

export const PaddingLess: Story = {
  args: { ...Default.args, padding: 'less', children: 'padding="less"' },
};

export const PaddingMore: Story = {
  args: { ...Default.args, padding: 'more', children: 'padding="more"' },
};

export const BorderRadius: Story = {
  render: () => (
    <Box display="flex" gap="normal">
      {(['less', 'normal', 'more'] as const).map((v) => (
        <Box key={v} padding="normal" borderRadius={v} style={surface}>
          borderRadius="{v}"
        </Box>
      ))}
    </Box>
  ),
};

export const BoxShadow: Story = {
  render: () => (
    <Box display="flex" gap="more" padding="more">
      {(['less', 'normal', 'more'] as const).map((v) => (
        <Box
          key={v}
          padding="normal"
          borderRadius="normal"
          boxShadow={v}
          style={{ background: 'var(--color-bg-primary)' }}
        >
          boxShadow="{v}"
        </Box>
      ))}
    </Box>
  ),
};

export const Size: Story = {
  args: {
    size: 'more',
  },

  render: () => (
    <Box display="flex" alignItems="center" gap="normal">
      {(['less', 'normal', 'more'] as const).map((v) => (
        <Box
          key={v}
          size={v}
          borderRadius="less"
          style={{ background: 'var(--color-primary-500)' }}
        />
      ))}
    </Box>
  ),
};

export const Layout: Story = {
  render: () => (
    <Box display="flex" flexDirection="column" gap="less" padding="normal" style={surface}>
      <Chip />
      <Chip />
      <Chip />
    </Box>
  ),
};

export const EscapeHatch: Story = {
  args: {
    padding: '12px 24px',
    width: 280,
    borderRadius: '50px',
    boxShadow: '0 8px 16px rgb(0 0 0 / 0.2)',
    style: { ...surface, textAlign: 'center' },
    children: 'Any CSS value, or a number for pixels',
  },
};
