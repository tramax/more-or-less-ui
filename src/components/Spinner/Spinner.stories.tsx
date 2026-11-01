import type { Meta, StoryObj } from '@storybook/react-vite';
import { showCode } from '../../../.storybook/snippet';
import { Button } from '../Button';
import { Spinner } from './Spinner';

const VARIANTS = ['less', 'normal', 'more'] as const;

const meta: Meta<typeof Spinner> = {
  title: 'Display/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    // No default: unset, the ring is as big as the text around it
    size: { control: 'select', options: ['less', 'normal', 'more'] },
  },
};
export default meta;
type Story = StoryObj<typeof Spinner>;

/** Named, so it is announced as a progress bar with no value. Without `aria-label` it is decorative. */
export const Default: Story = {
  args: { 'aria-label': 'Loading' },
};

export const Size: Story = {
  parameters: showCode(
    VARIANTS.map((v) => `<Spinner size="${v}" aria-label="Loading" />`).join('\n'),
  ),
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1rem' }}>
      {VARIANTS.map((v) => (
        <Spinner key={v} size={v} aria-label="Loading" />
      ))}
    </div>
  ),
};

/** With no `size` it is 1em: as big as the text it sits in, in the text's color. */
export const FollowsTheText: Story = {
  parameters: showCode(`<p>
  <Spinner aria-label="Saving" /> Saving…
</p>
<p style={{ fontSize: '2rem' }}>
  <Spinner aria-label="Saving" /> Saving…
</p>`),
  render: () => (
    <div style={{ padding: '1rem' }}>
      <p>
        <Spinner aria-label="Saving" /> Saving…
      </p>
      <p style={{ fontSize: '2rem', margin: 0 }}>
        <Spinner aria-label="Saving" /> Saving…
      </p>
    </div>
  ),
};

/** Button and Select show the same ring for `isLoading`; there it is hidden from assistive tech. */
export const InAButton: Story = {
  render: () => (
    <Button isLoading style={{ margin: '1rem' }}>
      Saving
    </Button>
  ),
};

export const EscapeHatch: Story = {
  argTypes: { size: { control: 'text' } },
  args: { size: '3rem', 'aria-label': 'Loading' },
};
