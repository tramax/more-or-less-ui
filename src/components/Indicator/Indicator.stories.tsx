import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Indicator, INDICATOR_DEFAULTS } from './Indicator';

// Storybook only reads defaults from destructuring, so state them for the Default column
const scaleControl = (prop: keyof typeof INDICATOR_DEFAULTS) =>
  ({
    control: 'select',
    options: ['less', 'normal', 'more'],
    table: { defaultValue: { summary: INDICATOR_DEFAULTS[prop] } },
  }) as const;

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;
const PLACEMENTS = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '1rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof Indicator> = {
  title: 'Display/Indicator',
  component: Indicator,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...INDICATOR_DEFAULTS, label: 'New', children: <Button>Inbox</Button> },
  parameters: { docs: { source: { transform: omitDefaults(INDICATOR_DEFAULTS) } } },
  argTypes: {
    size: scaleControl('size'),
    placement: { control: 'select', options: PLACEMENTS },
    overlap: { control: 'inline-radio', options: ['rectangle', 'circle'] },
    count: { control: 'number' },
    children: { control: false },
  },
};
export default meta;
type Story = StoryObj<typeof Indicator>;

/** No `count`: a dot. In the brand color, not red: it says "something is here", not "something is wrong". */
export const Default: Story = {};

export const Count: Story = {
  args: { count: 3, label: '3 unread messages' },
};

/** A count above `max` (99 unless set) reads "99+"; 0 shows nothing unless `isZeroShown`. */
export const Capped: Story = {
  parameters: showCode(`<Indicator count={7} label="7 unread"><Button>Inbox</Button></Indicator>
<Indicator count={240} label="More than 99 unread"><Button>Inbox</Button></Indicator>
<Indicator count={12} max={9} label="More than 9 unread"><Button>Inbox</Button></Indicator>`),
  render: () => (
    <Row>
      <Indicator count={7} label="7 unread">
        <Button>Inbox</Button>
      </Indicator>
      <Indicator count={240} label="More than 99 unread">
        <Button>Inbox</Button>
      </Indicator>
      <Indicator count={12} max={9} label="More than 9 unread">
        <Button>Inbox</Button>
      </Indicator>
    </Row>
  ),
};

/** `size` scales the dot and the count's height; the wrapped content is not touched. */
export const Size: Story = {
  parameters: showCode(
    VARIANTS.map(
      (v) => `<Indicator size="${v}" label="Online"><Avatar name="Ada Lovelace" /></Indicator>
<Indicator size="${v}" count={8} label="8 unread"><Avatar name="Ada Lovelace" /></Indicator>`,
    ).join('\n'),
  ),
  render: () => (
    <Row>
      {VARIANTS.map((v) => (
        <Indicator key={v} size={v} overlap="circle" label="Online">
          <Avatar name="Ada Lovelace" />
        </Indicator>
      ))}
      {VARIANTS.map((v) => (
        <Indicator key={v} size={v} overlap="circle" count={8} label="8 unread">
          <Avatar name="Ada Lovelace" />
        </Indicator>
      ))}
    </Row>
  ),
};

/** The four corners. "start" and "end" are logical, so they mirror in a right-to-left page. */
export const Placement: Story = {
  parameters: showCode(
    PLACEMENTS.map(
      (p) => `<Indicator placement="${p}" label="New"><Button>Inbox</Button></Indicator>`,
    ).join('\n'),
  ),
  render: () => (
    <Row>
      {PLACEMENTS.map((p) => (
        <Indicator key={p} placement={p} label="New">
          <Button>Inbox</Button>
        </Indicator>
      ))}
    </Row>
  ),
};

/**
 * `overlap="circle"` sits the mark on the rim of what it wraps, where a rectangle's corner would leave
 * it floating off to one side. A status dot on an Avatar.
 */
export const OnAvatar: Story = {
  parameters: showCode(`<Indicator overlap="circle" label="Online">
  <Avatar name="Ada Lovelace" />
</Indicator>
<Indicator label="Online">
  <Avatar name="Ada Lovelace" />
</Indicator>`),
  render: () => (
    <Row>
      <Indicator overlap="circle" label="Online">
        <Avatar name="Ada Lovelace" />
      </Indicator>
      <Indicator label="Online (rectangle: off the rim)">
        <Avatar name="Ada Lovelace" />
      </Indicator>
    </Row>
  ),
};

/** The mark pops in when it appears and shrinks away when the count falls to 0 or `isHidden` is set; the content stays where it is. */
export const Appearing: Story = {
  parameters: showCode(`const [count, setCount] = useState(0);
// ...
<Indicator count={count} label={\`\${count} unread\`}>
  <Button onClick={() => setCount((c) => c + 1)}>Inbox</Button>
</Indicator>`),
  render: function Render() {
    const [count, setCount] = useState(0);
    useEffect(() => {
      const id = setInterval(() => setCount((c) => (c + 1) % 5), 1600);
      return () => clearInterval(id);
    }, []);
    return (
      <Row>
        <Indicator count={count} label={`${count} unread`}>
          <Button>Inbox</Button>
        </Indicator>
      </Row>
    );
  },
};

export const EscapeHatch: Story = {
  argTypes: { size: textControl },
  args: { size: '1.5rem', count: 5, label: '5 unread' },
};
