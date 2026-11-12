import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Slider, SLIDER_DEFAULTS } from './Slider';

const VARIANTS = ['less', 'normal', 'more'] as const;

// The Size story renders all three variants at once, so its controls would do nothing. Its render
// returns <Column>, which Storybook can't turn into <Slider> code, so spell the snippet out.
const comparison = {
  controls: { disable: true },
  docs: {
    source: {
      code: VARIANTS.map(
        (v) => `<Slider size="${v}" label="size=&quot;${v}&quot;" defaultValue={40} />`,
      ).join('\n\n'),
      transform: (code: string) => code,
    },
  },
};

const Column = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof Slider> = {
  title: 'Inputs/Slider',
  component: Slider,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...SLIDER_DEFAULTS, label: 'Volume', defaultValue: 40 },
  parameters: { docs: { source: { transform: omitDefaults(SLIDER_DEFAULTS) } } },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem', maxWidth: '100%', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: SLIDER_DEFAULTS.size } },
    },
    min: { control: 'number', table: { defaultValue: { summary: '0' } } },
    max: { control: 'number', table: { defaultValue: { summary: '100' } } },
    step: { control: 'number', table: { defaultValue: { summary: '1' } } },
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {};

export const WithTooltip: Story = {
  args: { tooltip: 'Applies to this device only.' },
};

export const Size: Story = {
  parameters: comparison,
  render: () => (
    <Column>
      {VARIANTS.map((v) => (
        <Slider key={v} size={v} label={`size="${v}"`} defaultValue={40} />
      ))}
    </Column>
  ),
};

/** A step of 25 snaps the thumb to five places; the arrow keys move by it too. */
export const Steps: Story = {
  args: { step: 25, defaultValue: 50 },
};

/** `formatValue` is what a screen reader hears in place of the number. */
export const WithValueText: Story = {
  args: { label: 'Quality', min: 1, max: 3, defaultValue: 2 },
  parameters: showCode(
    `const names = ['Low', 'Medium', 'High'];

<Slider
  label="Quality"
  min={1}
  max={3}
  defaultValue={2}
  formatValue={(value) => names[value - 1]}
/>`,
  ),
  render: (args) => (
    <Slider {...args} formatValue={(value) => ['Low', 'Medium', 'High'][value - 1]!} />
  ),
};

// The visible value is not part of the slider (yet): show it beside the label from the parent's state
const ControlledSlider = () => {
  const [value, setValue] = useState(30);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
      <Slider label="Volume" value={value} onChange={setValue} />
      <button type="button" onClick={() => setValue(0)}>
        Mute
      </button>
      <output>value: {value}</output>
    </div>
  );
};

/** `value` and `onChange` make the slider controlled. The caller owns the number, so it can also set it. */
export const Controlled: Story = {
  parameters: showCode(`const [value, setValue] = useState(30);

<Slider label="Volume" value={value} onChange={setValue} />
<button onClick={() => setValue(0)}>Mute</button>`),
  render: () => <ControlledSlider />,
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const Invalid: Story = {
  args: { label: 'Budget', defaultValue: 10, error: 'The budget must be at least 20' },
};
