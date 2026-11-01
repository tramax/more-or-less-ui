import type { Meta, StoryObj } from '@storybook/react-vite';
import { showCode } from '../../../.storybook/snippet';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Display/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
  },
};
export default meta;
type Story = StoryObj<typeof Divider>;

/** No margin of its own: the space around it is the Stack's `gap`. */
export const Default: Story = {
  parameters: showCode(`<Stack>
  <Text>Profile</Text>
  <Divider />
  <Text>Notifications</Text>
</Stack>`),
  render: (args) => (
    <Stack style={{ padding: '1rem', maxWidth: '20rem' }}>
      <Text>Profile</Text>
      <Divider {...args} />
      <Text>Notifications</Text>
    </Stack>
  ),
};

/** In a row it stretches to the row's height, whatever the Stack's `align`. */
export const Vertical: Story = {
  parameters: showCode(`<Stack direction="row" align="center">
  <Text>Docs</Text>
  <Divider orientation="vertical" />
  <Text>Blog</Text>
  <Divider orientation="vertical" />
  <Text>Changelog</Text>
</Stack>`),
  render: () => (
    <Stack direction="row" align="center" style={{ padding: '1rem' }}>
      <Text>Docs</Text>
      <Divider orientation="vertical" />
      <Text>Blog</Text>
      <Divider orientation="vertical" />
      <Text>Changelog</Text>
    </Stack>
  ),
};
