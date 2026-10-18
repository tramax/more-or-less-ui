import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from './Box';

const scaleControl = {
  control: 'select',
  options: [undefined, 'less', 'normal', 'more'],
} as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

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
    background: scaleControl,
  },
};
export default meta;
type Story = StoryObj<typeof Box>;

export const Default: Story = {
  args: { padding: 'normal', borderRadius: 'normal', background: 'normal', children: 'Box' },
};

export const PaddingLess: Story = {
  args: { ...Default.args, padding: 'less', children: 'padding="less"' },
};

export const PaddingMore: Story = {
  args: { ...Default.args, padding: 'more', children: 'padding="more"' },
};

export const Background: Story = {
  render: () => (
    <Box display="flex" gap="normal">
      {VARIANTS.map((v) => (
        <Box key={v} padding="normal" borderRadius="normal" background={v}>
          background="{v}"
        </Box>
      ))}
    </Box>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <Box display="flex" gap="normal">
      {VARIANTS.map((v) => (
        <Box key={v} padding="normal" borderRadius={v} background="normal">
          borderRadius="{v}"
        </Box>
      ))}
    </Box>
  ),
};

export const BoxShadow: Story = {
  render: () => (
    <Box display="flex" gap="more" padding="more">
      {VARIANTS.map((v) => (
        <Box key={v} padding="normal" borderRadius="normal" boxShadow={v} background="normal">
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
      {VARIANTS.map((v) => (
        <Box key={v} size={v} borderRadius="less" background="more" />
      ))}
    </Box>
  ),
};

export const Layout: Story = {
  render: () => (
    <Box
      display="flex"
      flexDirection="column"
      gap="less"
      padding="normal"
      borderRadius="normal"
      background="normal"
    >
      <Box size="normal" borderRadius="less" background="more" />
      <Box size="normal" borderRadius="less" background="more" />
      <Box size="normal" borderRadius="less" background="more" />
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
