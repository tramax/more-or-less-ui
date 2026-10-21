import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, BOX_DEFAULTS } from './Box';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof BOX_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: BOX_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

type VariantProp = 'padding' | 'background' | 'borderRadius' | 'boxShadow';

// The variant stories render all three variants at once, so their controls would do nothing. Their
// render returns <Variants>, which Storybook can't turn into <Box> code, so spell the snippet out
// (and skip omitDefaults, which would also strip the label text inside each Box).
const comparison = (prop: VariantProp) => ({
  controls: { disable: true },
  docs: {
    source: {
      code: VARIANTS.map((v) => `<Box ${prop}="${v}">\n  ${prop}="${v}"\n</Box>`).join('\n\n'),
      transform: (code: string) => code,
    },
  },
});

// Lays the variants out side by side without adding Box's own defaults to the demo
const Row = ({ alignItems, children }: { alignItems?: 'flex-start'; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems, gap: '1rem' }}>{children}</div>
);

// One Box per variant, each labelled with the prop it demonstrates
const Variants = ({ prop }: { prop: VariantProp }) => (
  <Row alignItems="flex-start">
    {VARIANTS.map((v) => (
      <Box key={v} {...{ [prop]: v }}>
        {prop}="{v}"
      </Box>
    ))}
  </Row>
);

// The controls get BOX_DEFAULTS as args, but users don't have to write them: drop props that are at
// their default from the code snippet, so a bare `<Box>` shows as `<Box>`
const omitDefaults = (code: string) =>
  Object.entries(BOX_DEFAULTS)
    .reduce(
      (c, [prop, value]) => c.replace(new RegExp(String.raw`\s+${prop}="${value}"`, 'g'), ''),
      code,
    )
    .replace(/<Box\s+>/g, '<Box>');

const meta: Meta<typeof Box> = {
  title: 'Layout and surfaces/Box',
  component: Box,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: BOX_DEFAULTS,
  parameters: { docs: { source: { transform: omitDefaults } } },
  argTypes: {
    padding: scaleControl('padding'),
    margin: scaleControl('margin'),
    borderRadius: scaleControl('borderRadius'),
    boxShadow: scaleControl('boxShadow'),
    background: scaleControl('background'),
  },
};
export default meta;
type Story = StoryObj<typeof Box>;

export const Default: Story = {
  args: { children: 'Box' },
};

export const Padding: Story = {
  parameters: comparison('padding'),
  render: () => <Variants prop="padding" />,
};

export const Background: Story = {
  parameters: comparison('background'),
  render: () => <Variants prop="background" />,
};

export const BorderRadius: Story = {
  parameters: comparison('borderRadius'),
  render: () => <Variants prop="borderRadius" />,
};

export const BoxShadow: Story = {
  parameters: comparison('boxShadow'),
  render: () => <Variants prop="boxShadow" />,
};

export const EscapeHatch: Story = {
  argTypes: {
    padding: textControl,
    borderRadius: textControl,
    boxShadow: textControl,
    background: textControl,
  },
  args: {
    padding: '12px 24px',
    borderRadius: '50px',
    boxShadow: '0 8px 16px rgb(0 0 0 / 0.2)',
    background: 'linear-gradient(135deg, #fde68a, #fca5a5)',
    style: { textAlign: 'center' },
    children: 'Any CSS value, or a number for pixels',
  },
};
