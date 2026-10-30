import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults } from '../../../.storybook/snippet';
import { Box } from '../Box';
import { Grid, GRID_DEFAULTS } from './Grid';

const meta: Meta<typeof Grid> = {
  title: 'Layout and surfaces/Grid',
  component: Grid,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: GRID_DEFAULTS,
  // A Grid fills the width of its parent and fits its columns to that width. Storybook centers a story
  // and shrink-wraps it, so the wrapper stands for the parent; its border shows how wide that is.
  decorators: [
    (Story) => (
      <div style={{ width: 'min(48rem, 90vw)', border: '1px solid currentColor' }}>
        <Story />
      </div>
    ),
  ],
  parameters: { docs: { source: { transform: omitDefaults(GRID_DEFAULTS) } } },
  argTypes: {
    gap: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      // Storybook only reads defaults from destructuring, so state them for the Default column
      table: { defaultValue: { summary: GRID_DEFAULTS.gap } },
    },
    // A number or `{ minWidth }`, so a select or a number box can't show both
    columns: { control: 'object' },
  },
};
export default meta;
type Story = StoryObj<typeof Grid>;

// Grid paints nothing, so each cell gets an outline to show where it sits
const Cell = ({ children }: { children: string }) => (
  <Box padding="normal" style={{ outline: '1px dashed currentColor' }}>
    {children}
  </Box>
);

const cells = (count: number) =>
  Array.from({ length: count }, (_, i) => <Cell key={i}>{`Item ${i + 1}`}</Cell>);

export const Default: Story = {
  args: { children: cells(4) },
};

export const FixedColumns: Story = {
  args: { columns: 3, children: cells(7) },
};

export const FitByWidth: Story = {
  args: { columns: { minWidth: '12rem' }, children: cells(7) },
};

export const EscapeHatch: Story = {
  argTypes: { gap: { control: 'text' } },
  args: { columns: { minWidth: '10rem' }, gap: '2rem', children: cells(7) },
};
