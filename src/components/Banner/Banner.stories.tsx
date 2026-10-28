import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Banner, BANNER_DEFAULTS } from './Banner';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof BANNER_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: BANNER_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

type VariantProp = 'size' | 'background';

const Column = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'grid', gap: '1rem', padding: '1rem' }}>{children}</div>
);

// The variant stories render all three variants at once, so their controls would do nothing
const comparison = (prop: VariantProp) =>
  showCode(
    VARIANTS.map((v) => `<Banner ${prop}="${v}">\n  ${prop}="${v}"\n</Banner>`).join('\n\n'),
  );

const Variants = ({ prop }: { prop: VariantProp }) => (
  <Column>
    {VARIANTS.map((v) => (
      <Banner key={v} {...{ [prop]: v }}>
        {prop}="{v}"
      </Banner>
    ))}
  </Column>
);

const meta: Meta<typeof Banner> = {
  title: 'Display/Banner',
  component: Banner,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: BANNER_DEFAULTS,
  parameters: { docs: { source: { transform: omitDefaults(BANNER_DEFAULTS) } } },
  argTypes: {
    size: scaleControl('size'),
    background: scaleControl('background'),
    // No `action` here: it would put a handler in every story's args, and a handler is what shows the
    // dismiss button. Only the Dismissible story passes one.
  },
};
export default meta;
type Story = StoryObj<typeof Banner>;

export const Default: Story = {
  args: { children: 'The office is closed on Monday.' },
};

export const Size: Story = {
  parameters: comparison('size'),
  render: () => <Variants prop="size" />,
};

/** How loudly it speaks: a faint brand tint, an opaque one, the brand color itself. */
export const Background: Story = {
  parameters: comparison('background'),
  render: () => <Variants prop="background" />,
};

export const WithTitle: Story = {
  args: {
    title: 'Scheduled downtime',
    children: 'The service will be unavailable on Sunday between 02:00 and 04:00.',
  },
};

/** `onDismiss` shows the ×. The banner doesn't hide itself; the caller stops rendering it. */
export const Dismissible: Story = {
  parameters: showCode(`const [open, setOpen] = useState(true);

{open && (
  <Banner title="New: dark mode" onDismiss={() => setOpen(false)}>
    Find it under Settings.
  </Banner>
)}`),
  render: () => <DismissibleBanner />,
};

function DismissibleBanner() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Banner title="New: dark mode" onDismiss={() => setOpen(false)}>
      Find it under Settings.
    </Banner>
  ) : (
    <button onClick={() => setOpen(true)}>Show again</button>
  );
}

/** The message is any content, so a link or a Button goes inside it. */
export const WithLink: Story = {
  args: {
    background: 'more',
    title: 'Version 2 is out',
    children: (
      <>
        Read what changed in the <a href="#changelog">changelog</a>.
      </>
    ),
  },
};

export const EscapeHatch: Story = {
  argTypes: {
    size: textControl,
    background: textControl,
  },
  args: {
    size: '1.25rem',
    background: 'linear-gradient(135deg, #fde68a, #fca5a5)',
    children: 'Any CSS value: a size in pixels or rem, and here a gradient background.',
  },
};
