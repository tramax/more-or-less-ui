import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Stack } from '../Stack';
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

// Text has no margin: spacing comes from the layout. A heading sits close to its own paragraph (an
// inner Stack with a small gap), and the sections are far apart (the outer Stack's bigger gap).
export const Headings: Story = {
  parameters: showCode(`<Stack gap="more">
  <Stack gap="less">
    <Text as="h2" size="more" fontWeight="more">First heading</Text>
    <Text as="p" color="less">The element says what it is; size, weight and color say how it looks.</Text>
  </Stack>
  <Stack gap="less">
    <Text as="h2" size="more" fontWeight="more">Second heading</Text>
    <Text as="p" color="less">Space comes from Stack and Box, not from Text.</Text>
  </Stack>
</Stack>`),
  render: () => (
    <Stack gap="more">
      <Stack gap="less">
        <Text as="h2" size="more" fontWeight="more">
          First heading
        </Text>
        <Text as="p" color="less">
          The element says what it is; size, weight and color say how it looks.
        </Text>
      </Stack>
      <Stack gap="less">
        <Text as="h2" size="more" fontWeight="more">
          Second heading
        </Text>
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
