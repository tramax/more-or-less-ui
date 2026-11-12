import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Title, TITLE_DEFAULTS } from './Title';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof TITLE_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: TITLE_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

const meta: Meta<typeof Title> = {
  title: 'Typography/Title',
  component: Title,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: TITLE_DEFAULTS,
  parameters: { docs: { source: { transform: omitDefaults(TITLE_DEFAULTS) } } },
  argTypes: {
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      table: { defaultValue: { summary: 'h2' } },
    },
    size: scaleControl('size'),
    fontWeight: scaleControl('fontWeight'),
    color: scaleControl('color'),
  },
};
export default meta;
type Story = StoryObj<typeof Title>;

export const Default: Story = {
  args: { children: 'Account settings' },
};

// --size-title-*: `less` is a quiet heading close to the body text, `normal` the everyday title, and
// `more` the loud one, which grows with the window (32px on a phone, 48px on a wide screen)
export const Size: Story = {
  parameters: showCode(VARIANTS.map((v) => `<Title size="${v}">size="${v}"</Title>`).join('\n')),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Title key={v} size={v}>
          size="{v}"
        </Title>
      ))}
    </Stack>
  ),
};

// Heavier than Text's at every step: a title's `normal` is semibold (--weight-title-*)
export const FontWeight: Story = {
  parameters: showCode(
    VARIANTS.map((v) => `<Title fontWeight="${v}">fontWeight="${v}"</Title>`).join('\n'),
  ),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Title key={v} fontWeight={v}>
          fontWeight="{v}"
        </Title>
      ))}
    </Stack>
  ),
};

// The same color scale as Text
export const Color: Story = {
  parameters: showCode(VARIANTS.map((v) => `<Title color="${v}">color="${v}"</Title>`).join('\n')),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Title key={v} color={v}>
          color="{v}"
        </Title>
      ))}
    </Stack>
  ),
};

/**
 * `as` is the heading level, where the section sits in the page's outline; `size` is how big it looks.
 * They are chosen apart: an `h3` can be large and an `h1` small, and a bare Title is `normal` at any level.
 */
export const Levels: Story = {
  parameters: showCode(`<Stack gap="more">
  <Stack gap="less">
    <Title as="h1" size="more">Release notes</Title>
    <Text as="p" color="less">The page's one h1, at the largest size.</Text>
  </Stack>
  <Stack gap="less">
    <Title as="h2">Version 2.0</Title>
    <Text as="p">A section: h2, at the normal size.</Text>
  </Stack>
  <Stack gap="less">
    <Title as="h3" size="less">Breaking changes</Title>
    <Text as="p">A subsection: h3, smaller.</Text>
  </Stack>
</Stack>`),
  render: () => (
    <Stack gap="more">
      <Stack gap="less">
        <Title as="h1" size="more">
          Release notes
        </Title>
        <Text as="p" color="less">
          The page's one h1, at the largest size.
        </Text>
      </Stack>
      <Stack gap="less">
        <Title as="h2">Version 2.0</Title>
        <Text as="p">A section: h2, at the normal size.</Text>
      </Stack>
      <Stack gap="less">
        <Title as="h3" size="less">
          Breaking changes
        </Title>
        <Text as="p">A subsection: h3, smaller.</Text>
      </Stack>
    </Stack>
  ),
};

/**
 * The titles' typeface is a token, `--font-family-title`. Unset, a title keeps the font around it; set it
 * on `:root` for the whole app, or on any element for the titles inside it, as here. Body text keeps
 * its own font. `--size-title-*`, `--weight-title-*` and `--line-height-title` are set the same way.
 */
export const CustomFont: Story = {
  parameters: showCode(`/* your CSS */
:root {
  --font-family-title: Georgia, 'Times New Roman', serif;
}

<Stack gap="less">
  <Title>A serif title</Title>
  <Text as="p">The body text keeps its own font.</Text>
</Stack>`),
  render: () => (
    <Stack
      gap="less"
      style={{ '--font-family-title': "Georgia, 'Times New Roman', serif" } as CSSProperties}
    >
      <Title>A serif title</Title>
      <Text as="p">The body text keeps its own font.</Text>
    </Stack>
  ),
};

export const EscapeHatch: Story = {
  argTypes: { size: textControl, fontWeight: textControl, color: textControl },
  args: {
    size: '3.5rem',
    fontWeight: 800,
    color: 'var(--color-danger)',
    children: 'Any CSS value, or a number for pixels (not for weight or color)',
  },
};

/**
 * As with Text, loading is the region's state: inside `aria-busy="true"` (or with it on the Title
 * itself) the title becomes a block as long as its text. Give it placeholder text of about the right
 * length.
 */
export const Loading: Story = {
  parameters: showCode(`<Title aria-busy={isLoading}>{page?.title ?? 'Loading the title'}</Title>`),
  render: () => <Title aria-busy>Loading the title</Title>,
};
