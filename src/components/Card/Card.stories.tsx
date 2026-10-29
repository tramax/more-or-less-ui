import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults } from '../../../.storybook/snippet';
import { Card, CARD_DEFAULTS } from './Card';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof CARD_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: CARD_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

type VariantProp = 'padding' | 'background' | 'borderRadius' | 'boxShadow';

// The variant stories render all three variants at once, so their controls would do nothing. Their
// render returns <Variants>, which Storybook can't turn into <Card> code, so spell the snippet out
// (and skip omitDefaults, which would also strip the label text inside each Card).
const comparison = (prop: VariantProp) => ({
  controls: { disable: true },
  docs: {
    source: {
      code: VARIANTS.map((v) => `<Card ${prop}="${v}">\n  ${prop}="${v}"\n</Card>`).join('\n\n'),
      transform: (code: string) => code,
    },
  },
});

// Lays the variants out side by side without adding Card's own defaults to the demo
const Row = ({ alignItems, children }: { alignItems?: 'flex-start'; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems, gap: '1rem' }}>{children}</div>
);

// One Card per variant, each labelled with the prop it demonstrates
const Variants = ({ prop }: { prop: VariantProp }) => (
  <Row alignItems="flex-start">
    {VARIANTS.map((v) => (
      <Card key={v} {...{ [prop]: v }}>
        {prop}="{v}"
      </Card>
    ))}
  </Row>
);

const meta: Meta<typeof Card> = {
  title: 'Layout and surfaces/Card',
  component: Card,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: CARD_DEFAULTS,
  parameters: { docs: { source: { transform: omitDefaults(CARD_DEFAULTS) } } },
  argTypes: {
    padding: scaleControl('padding'),
    borderRadius: scaleControl('borderRadius'),
    boxShadow: scaleControl('boxShadow'),
    background: scaleControl('background'),
  },
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: { children: 'Card' },
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
