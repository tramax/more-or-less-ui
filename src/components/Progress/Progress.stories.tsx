import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Progress, PROGRESS_DEFAULTS } from './Progress';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof PROGRESS_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: PROGRESS_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

// Small steps and large jumps, ending at the full bar before starting over
const STEPS = [0, 6, 9, 55, 60, 100];

const meta: Meta<typeof Progress> = {
  title: 'Display/Progress',
  component: Progress,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...PROGRESS_DEFAULTS, 'aria-label': 'Upload' },
  parameters: { docs: { source: { transform: omitDefaults(PROGRESS_DEFAULTS) } } },
  // A bar fills its container's width, and the centered layout shrinks the story to its content,
  // which would leave the bar no width at all
  decorators: [
    (Story) => (
      <div style={{ width: '24rem', maxWidth: '100%', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: scaleControl('size'),
    shape: { control: 'inline-radio', options: ['bar', 'circle'] },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: { value: 40 },
};

export const Circle: Story = {
  args: { shape: 'circle', value: 65 },
};

/** `size` scales the bar's thickness and the ring's diameter. */
export const Size: Story = {
  parameters: showCode(
    VARIANTS.map((v) => `<Progress size="${v}" value={60} aria-label="Upload" />`).join('\n') +
      '\n' +
      VARIANTS.map(
        (v) => `<Progress shape="circle" size="${v}" value={60} aria-label="Upload" />`,
      ).join('\n'),
  ),
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
      {VARIANTS.map((v) => (
        <Progress key={v} size={v} value={60} aria-label="Upload" />
      ))}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {VARIANTS.map((v) => (
          <Progress key={v} shape="circle" size={v} value={60} aria-label="Upload" />
        ))}
      </div>
    </div>
  ),
};

/** No `value`: the length of the wait is unknown, so the bar slides and the circle turns. */
export const Indeterminate: Story = {
  parameters: showCode(`<Progress aria-label="Loading" />
<Progress shape="circle" aria-label="Loading" />`),
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
      <Progress aria-label="Loading" />
      <Progress shape="circle" aria-label="Loading" />
    </div>
  ),
};

/** `value` counts up to `max`, so files and bytes need no conversion. `aria-valuetext` says it in words. */
export const CustomMax: Story = {
  args: { value: 3, max: 12, 'aria-valuetext': '3 of 12 files' },
};

/** A value outside 0 to `max` is held to it. */
export const Clamped: Story = {
  parameters: showCode(`<Progress value={-20} aria-label="Under" />
<Progress value={140} aria-label="Over" />`),
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
      <Progress value={-20} aria-label="Under" />
      <Progress value={140} aria-label="Over" />
    </div>
  ),
};

/**
 * Each move takes longer the further it goes: the small steps settle quickly and the jumps are
 * followed by the eye. Reaching 100 from below plays a short flourish.
 */
export const Animated: Story = {
  parameters: showCode(`const [value, setValue] = useState(0);
// ...
<Progress value={value} aria-label="Upload" />
<Progress shape="circle" value={value} aria-label="Upload" />`),
  render: function Render() {
    const [step, setStep] = useState(0);
    useEffect(() => {
      const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1600);
      return () => clearInterval(id);
    }, []);
    const value = STEPS[step] ?? 0;
    return (
      <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
        <Progress value={value} aria-label="Upload" />
        <Progress shape="circle" value={value} aria-label="Upload" />
      </div>
    );
  },
};

export const EscapeHatch: Story = {
  argTypes: { size: textControl },
  args: { size: '1.5rem', shape: 'circle', value: 50 },
};
