import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults } from '../../../.storybook/snippet';
import { Box } from '../Box';
import { Stack, STACK_DEFAULTS } from './Stack';

const meta: Meta<typeof Stack> = {
  title: 'Layout and surfaces/Stack',
  component: Stack,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: STACK_DEFAULTS,
  // Storybook centers a story and shrink-wraps it, which leaves `justify` no free space to share out.
  // The wrapper stands for the parent: a Stack fills its width, and the border shows how wide that is.
  decorators: [
    (Story) => (
      <div style={{ width: 'min(28rem, 90vw)', border: '1px solid currentColor' }}>
        <Story />
      </div>
    ),
  ],
  parameters: { docs: { source: { transform: omitDefaults(STACK_DEFAULTS) } } },
  argTypes: {
    gap: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      // Storybook only reads defaults from destructuring, so state them for the Default column
      table: { defaultValue: { summary: STACK_DEFAULTS.gap } },
    },
    direction: {
      control: 'inline-radio',
      options: ['column', 'row'],
      table: { defaultValue: { summary: STACK_DEFAULTS.direction } },
    },
    align: {
      control: 'select',
      options: [undefined, 'start', 'center', 'end', 'stretch', 'baseline'],
    },
    justify: {
      control: 'select',
      options: [undefined, 'start', 'center', 'end', 'between', 'around', 'evenly'],
    },
    wrap: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Stack>;

// Stack paints nothing, so each child gets an outline to show where it sits
const Item = ({ children, style }: { children: string; style?: React.CSSProperties }) => (
  <Box padding="less" style={{ outline: '1px dashed currentColor', ...style }}>
    {children}
  </Box>
);

// Different widths, heights and text sizes, so every `align` value (and `baseline`) shows a difference
const items = [
  <Item key="one" style={{ fontSize: '0.875rem' }}>
    One
  </Item>,
  <Item key="two" style={{ fontSize: '1.75rem' }}>
    Two, big
  </Item>,
  <Item key="three">Three, with a longer label</Item>,
];

export const Default: Story = {
  args: { children: items },
};

export const Row: Story = {
  args: { direction: 'row', align: 'center', gap: 'less', children: items },
};

export const TitleAndActions: Story = {
  args: {
    direction: 'row',
    justify: 'between',
    align: 'center',
    children: [<Item key="t">Title</Item>, <Item key="a">Actions</Item>],
  },
};

export const Wrapping: Story = {
  name: 'Wrapping list',
  args: {
    direction: 'row',
    wrap: true,
    gap: 'less',
    style: { maxWidth: 240 },
    children: ['Design', 'Engineering', 'Research', 'Marketing', 'Support', 'Sales'].map(
      (label) => <Item key={label}>{label}</Item>,
    ),
  },
};

export const EscapeHatch: Story = {
  argTypes: { gap: { control: 'text' } },
  args: { gap: '2.5rem', children: items },
};
