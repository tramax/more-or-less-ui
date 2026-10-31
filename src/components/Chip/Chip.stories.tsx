import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Chip, CHIP_DEFAULTS } from './Chip';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof CHIP_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: CHIP_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

// An `icon` is any node; an svg fills its square and takes the text color
const StarIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="m8 1.5 2 4.2 4.5.6-3.3 3.1.8 4.5L8 11.7 4 13.9l.8-4.5L1.5 6.3 6 5.7z" />
  </svg>
);

const VARIANTS = ['less', 'normal', 'more'] as const;

type VariantProp = 'size' | 'borderRadius' | 'background';

const Row = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
    {children}
  </div>
);

// The variant stories render all three variants at once, so their controls would do nothing
const comparison = (prop: VariantProp) =>
  showCode(VARIANTS.map((v) => `<Chip ${prop}="${v}">${prop}="${v}"</Chip>`).join('\n'));

const Variants = ({ prop }: { prop: VariantProp }) => (
  <Row>
    {VARIANTS.map((v) => (
      <Chip key={v} {...{ [prop]: v }}>
        {`${prop}="${v}"`}
      </Chip>
    ))}
  </Row>
);

const meta: Meta<typeof Chip> = {
  title: 'Display/Chip',
  component: Chip,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: CHIP_DEFAULTS,
  parameters: { docs: { source: { transform: omitDefaults(CHIP_DEFAULTS) } } },
  argTypes: {
    size: scaleControl('size'),
    borderRadius: scaleControl('borderRadius'),
    background: scaleControl('background'),
    // A function has no control of its own, and an `action` would put a handler in every story's
    // args, which is what shows the remove button. So a choice that maps to one: nothing until picked.
    onRemove: {
      control: 'radio',
      options: ['none', 'handler'],
      mapping: { none: undefined, handler: () => {} },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: { children: 'Beta' },
};

export const Size: Story = {
  parameters: comparison('size'),
  render: () => <Variants prop="size" />,
};

/** The corners: nearly square, rounded, and a full pill. Round, and in em, so they follow `size`. */
export const BorderRadius: Story = {
  parameters: comparison('borderRadius'),
  render: () => <Variants prop="borderRadius" />,
};

/** How it stands out: an outline, a semi-transparent brand tint, the brand color itself. */
export const Background: Story = {
  parameters: comparison('background'),
  render: () => <Variants prop="background" />,
};

export const WithIcon: Story = {
  args: { children: 'Favourite', icon: <StarIcon /> },
};

/**
 * `onRemove` adds the ×, and a click anywhere on the chip calls it. The chip doesn't hide itself; the
 * caller stops rendering it. The × is a Tab stop, so a keyboard can remove it too.
 */
export const Removable: Story = {
  parameters: showCode(`const [tags, setTags] = useState(['Design', 'Research', 'Web']);

{tags.map((tag) => (
  <Chip key={tag} onRemove={() => setTags(tags.filter((t) => t !== tag))}>
    {tag}
  </Chip>
))}`),
  render: () => <RemovableChips />,
};

function RemovableChips() {
  const [tags, setTags] = useState(['Design', 'Research', 'Web']);
  return (
    <Row>
      {tags.map((tag) => (
        <Chip key={tag} onRemove={() => setTags(tags.filter((t) => t !== tag))}>
          {tag}
        </Chip>
      ))}
      {tags.length === 0 && (
        <button onClick={() => setTags(['Design', 'Research', 'Web'])}>Reset</button>
      )}
    </Row>
  );
}

/** A long label gives way before the × does. */
export const LongLabel: Story = {
  parameters: showCode(`<div style={{ width: 160 }}>
  <Chip onRemove={() => {}}>A label much longer than the room it has</Chip>
</div>`),
  render: () => (
    <div style={{ width: 160, padding: '1rem' }}>
      <Chip onRemove={() => {}}>A label much longer than the room it has</Chip>
    </div>
  ),
};

export const EscapeHatch: Story = {
  argTypes: {
    size: textControl,
    borderRadius: textControl,
    background: textControl,
  },
  args: {
    size: '1.25rem',
    borderRadius: '2px',
    background: 'linear-gradient(135deg, #fde68a, #fca5a5)',
    children: 'Any CSS value',
  },
};
