import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Stack } from '../Stack';
import { Title } from '../Title';
import { Text, TEXT_DEFAULTS } from './Text';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof TEXT_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: TEXT_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

const meta: Meta<typeof Text> = {
  title: 'Typography/Text',
  component: Text,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: TEXT_DEFAULTS,
  parameters: { docs: { source: { transform: omitDefaults(TEXT_DEFAULTS) } } },
  argTypes: {
    as: {
      control: 'select',
      options: ['span', 'p', 'div', 'strong', 'em', 'small', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      table: { defaultValue: { summary: 'span' } },
    },
    size: scaleControl('size'),
    fontWeight: scaleControl('fontWeight'),
    color: scaleControl('color'),
  },
};
export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: { children: 'The quick brown fox' },
};

export const Size: Story = {
  parameters: showCode(VARIANTS.map((v) => `<Text size="${v}">size="${v}"</Text>`).join('\n')),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Text key={v} size={v}>
          size="{v}"
        </Text>
      ))}
    </Stack>
  ),
};

export const FontWeight: Story = {
  parameters: showCode(
    VARIANTS.map((v) => `<Text fontWeight="${v}">fontWeight="${v}"</Text>`).join('\n'),
  ),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Text key={v} fontWeight={v}>
          fontWeight="{v}"
        </Text>
      ))}
    </Stack>
  ),
};

// less is quiet, normal is the plain text color, more is the brand color: the one thing to look at
export const Color: Story = {
  parameters: showCode(VARIANTS.map((v) => `<Text color="${v}">color="${v}"</Text>`).join('\n')),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Text key={v} color={v}>
          color="{v}"
        </Text>
      ))}
    </Stack>
  ),
};

// Text has no margin, and nor has Title: spacing comes from the layout. A heading sits close to its own
// paragraph (an inner Stack with a small gap), and the sections are far apart (the outer Stack's bigger
// gap). The headings are Titles: the heading type scale and font, from the title tokens.
export const Headings: Story = {
  parameters: showCode(`<Stack gap="more">
  <Stack gap="less">
    <Title>First heading</Title>
    <Text as="p" color="less">The element says what it is; size, weight and color say how it looks.</Text>
  </Stack>
  <Stack gap="less">
    <Title>Second heading</Title>
    <Text as="p" color="less">Space comes from Stack and Box, not from Text.</Text>
  </Stack>
</Stack>`),
  render: () => (
    <Stack gap="more">
      <Stack gap="less">
        <Title>First heading</Title>
        <Text as="p" color="less">
          The element says what it is; size, weight and color say how it looks.
        </Text>
      </Stack>
      <Stack gap="less">
        <Title>Second heading</Title>
        <Text as="p" color="less">
          Space comes from Stack and Box, not from Text.
        </Text>
      </Stack>
    </Stack>
  ),
};

export const EscapeHatch: Story = {
  argTypes: { size: textControl, fontWeight: textControl, color: textControl },
  args: {
    size: '2rem',
    fontWeight: 800,
    // Meaning (an error) is not a color step: use the theme's color variable
    color: 'var(--color-danger)',
    children: 'Any CSS value, or a number for pixels (not for color)',
  },
};

const LoadingDemo = () => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <Stack gap="more" style={{ maxWidth: '24rem' }}>
      {/* The only switch is aria-busy on the region. Each child is the real component with
          placeholder content, so the layout is the real one and nothing jumps when the data comes. */}
      <Stack gap="normal" aria-busy={isLoading}>
        <Avatar
          isTextShown
          name={isLoading ? 'Loading name' : 'Ada Lovelace'}
          description={isLoading ? 'Loading role' : 'Mathematician'}
        />
        <Text as="p">
          {isLoading
            ? 'A placeholder about as long as the text that will replace it, so the block is about as wide.'
            : 'Ada Lovelace wrote the first published program, for the Analytical Engine, in 1843.'}
        </Text>
      </Stack>
      <Button onClick={() => setIsLoading((v) => !v)}>
        {isLoading ? 'Show the content' : 'Show the placeholders'}
      </Button>
    </Stack>
  );
};

/**
 * Loading is a state of the region, not a prop of each component: set `aria-busy` on a Stack, a Card
 * or the Text itself, and the Text, Avatar and option text inside become blocks as long as their
 * content. Give them placeholder content of about the right length.
 */
export const Loading: Story = {
  parameters: showCode(`<Stack aria-busy={isLoading}>
  <Avatar isTextShown name={user?.name ?? 'Loading name'} description={user?.role ?? 'Loading role'} />
  <Text as="p">{user?.bio ?? 'A placeholder about as long as the real bio'}</Text>
</Stack>`),
  render: () => <LoadingDemo />,
};
