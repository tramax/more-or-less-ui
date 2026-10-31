import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Avatar, AVATAR_DEFAULTS } from './Avatar';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof AVATAR_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: AVATAR_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

// A public-domain portrait, as a 250px thumbnail (the original is 2 MB)
const PHOTO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ada_Lovelace_portrait.jpg/250px-Ada_Lovelace_portrait.jpg';

const Row = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
    {children}
  </div>
);

const NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Margaret Hamilton',
  'Linus Torvalds',
];

const meta: Meta<typeof Avatar> = {
  title: 'Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: AVATAR_DEFAULTS,
  parameters: { docs: { source: { transform: omitDefaults(AVATAR_DEFAULTS) } } },
  argTypes: {
    size: scaleControl('size'),
  },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: { name: 'Ada Lovelace' },
};

export const Size: Story = {
  parameters: showCode(
    VARIANTS.map((v) => `<Avatar size="${v}" name="Ada Lovelace" />`).join('\n'),
  ),
  render: () => (
    <Row>
      {VARIANTS.map((v) => (
        <Avatar key={v} size={v} name="Ada Lovelace" />
      ))}
    </Row>
  ),
};

/** The color comes from the name: the same name is always the same color, and there is no prop for it. */
export const ColorFromName: Story = {
  parameters: showCode(NAMES.map((n) => `<Avatar name="${n}" />`).join('\n')),
  render: () => (
    <Row>
      {NAMES.map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </Row>
  ),
};

export const Photo: Story = {
  args: { src: PHOTO, name: 'Ada Lovelace' },
};

/** A `src` that fails to load falls back as if there were none. */
export const BrokenPhoto: Story = {
  args: { src: '/this-does-not-exist.png', name: 'Ada Lovelace' },
};

/** Initials from `name`; `children` of your own; a plain glyph, on the plain field fill, with neither. */
export const Fallbacks: Story = {
  parameters: showCode(`<Avatar name="Ada Lovelace" />
<Avatar name="Ada Lovelace">★</Avatar>
<Avatar alt="Anonymous" />`),
  render: () => (
    <Row>
      <Avatar name="Ada Lovelace" />
      <Avatar name="Ada Lovelace">★</Avatar>
      <Avatar alt="Anonymous" />
    </Row>
  ),
};

/** `alt=""` when the name is written beside it, so a screen reader doesn't say it twice. */
export const BesideTheName: Story = {
  parameters: showCode(`<Avatar name="Ada Lovelace" alt="" />
<span>Ada Lovelace</span>`),
  render: () => (
    <Row>
      <Avatar name="Ada Lovelace" alt="" />
      <span>Ada Lovelace</span>
    </Row>
  ),
};

/** Inside a flex row it keeps its circle; it is never squeezed. */
export const InARow: Story = {
  parameters: showCode(`<div style={{ display: 'flex', width: 120 }}>
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Alan Turing" />
</div>`),
  render: () => (
    <div style={{ display: 'flex', width: 120, padding: '1rem' }}>
      <Avatar name="Ada Lovelace" />
      <Avatar name="Grace Hopper" />
      <Avatar name="Alan Turing" />
    </div>
  ),
};

export const EscapeHatch: Story = {
  argTypes: {
    size: textControl,
  },
  args: {
    size: '1.5rem',
    name: 'Ada Lovelace',
    // The name's color is a default; a style of your own wins
    style: { background: 'linear-gradient(135deg, #fde68a, #fca5a5)' },
  },
};
