import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults } from '../../../.storybook/snippet';
import { Button, BUTTON_DEFAULTS } from './Button';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof BUTTON_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: BUTTON_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

type VariantProp = 'size' | 'background';

// The variant stories render all three variants at once, so their controls would do nothing. Their
// render returns <Variants>, which Storybook can't turn into <Button> code, so spell the snippet out.
const comparison = (prop: VariantProp) => ({
  controls: { disable: true },
  docs: {
    source: {
      code: VARIANTS.map((v) => `<Button ${prop}="${v}">\n  ${prop}="${v}"\n</Button>`).join(
        '\n\n',
      ),
      transform: (code: string) => code,
    },
  },
});

const Row = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
    {children}
  </div>
);

// One Button per variant, each labelled with the prop it demonstrates
const Variants = ({ prop }: { prop: VariantProp }) => (
  <Row>
    {VARIANTS.map((v) => (
      <Button key={v} {...{ [prop]: v }}>
        {prop}="{v}"
      </Button>
    ))}
  </Row>
);

const meta: Meta<typeof Button> = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: BUTTON_DEFAULTS,
  parameters: { docs: { source: { transform: omitDefaults(BUTTON_DEFAULTS) } } },
  argTypes: {
    size: scaleControl('size'),
    background: scaleControl('background'),
    onClick: { action: 'clicked' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Button' },
};

export const Size: Story = {
  parameters: comparison('size'),
  render: () => <Variants prop="size" />,
};

export const Background: Story = {
  parameters: comparison('background'),
  render: () => <Variants prop="background" />,
};

export const Disabled: Story = {
  args: { isDisabled: true, children: 'Disabled' },
};

export const Loading: Story = {
  args: { isLoading: true, children: 'Saving' },
};

export const EscapeHatch: Story = {
  argTypes: {
    size: textControl,
    background: textControl,
  },
  args: {
    size: '1.5rem',
    background: 'linear-gradient(135deg, #fde68a, #fca5a5)',
    children: 'Any CSS value, or a number for pixels',
  },
};
