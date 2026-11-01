import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ScaleProp } from '@/types/scale';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { Chip, CHIP_DEFAULTS } from './Chip';

// An `icon` is any node; an svg fills its square and takes the text color
const StarIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="m8 1.5 2 4.2 4.5.6-3.3 3.1.8 4.5L8 11.7 4 13.9l.8-4.5L1.5 6.3 6 5.7z" />
  </svg>
);

const Row = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof Chip> = {
  title: 'Display/Chip',
  component: Chip,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: CHIP_DEFAULTS,
  parameters: { docs: { source: { transform: omitDefaults(CHIP_DEFAULTS) } } },
  argTypes: {
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      // Storybook only reads defaults from destructuring, so state them for the Default column
      table: { defaultValue: { summary: CHIP_DEFAULTS.size } },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Chip>;

// The Default story's controls. A chip's kind comes from which handlers it has, which a control can't
// switch, so `kind` stands in for them and the story passes the right ones.
type PlaygroundArgs = {
  kind: 'static' | 'removable' | 'selectable';
  children: string;
  size: ScaleProp;
  hasIcon: boolean;
  isSelected: boolean;
  isDisabled: boolean;
};

function Playground({
  kind,
  children,
  size,
  hasIcon,
  isSelected: initial,
  isDisabled,
}: PlaygroundArgs) {
  const [isSelected, setIsSelected] = useState(initial);
  const [isRemoved, setIsRemoved] = useState(false);
  const common = { size, icon: hasIcon ? <StarIcon /> : undefined };

  if (kind === 'static') return <Chip {...common}>{children}</Chip>;
  if (kind === 'removable') {
    return isRemoved ? (
      <button onClick={() => setIsRemoved(false)}>Bring it back</button>
    ) : (
      <Chip {...common} isDisabled={isDisabled} onRemove={() => setIsRemoved(true)}>
        {children}
      </Chip>
    );
  }
  return (
    <Chip
      {...common}
      isDisabled={isDisabled}
      isSelected={isSelected}
      onSelectedChange={setIsSelected}
    >
      {children}
    </Chip>
  );
}

/**
 * Try the three kinds. With no handler a chip is a label: outlined, and it does nothing. `onRemove`
 * adds the ×, and a click anywhere on the chip calls it; the chip doesn't hide itself, the caller stops
 * rendering it. `isSelected` and `onSelectedChange` make a toggle. The last two are filled and react to
 * hover and press.
 */
export const Default: StoryObj<PlaygroundArgs> = {
  args: {
    kind: 'removable',
    children: 'Design',
    size: CHIP_DEFAULTS.size,
    hasIcon: false,
    isSelected: false,
    isDisabled: false,
  },
  argTypes: {
    kind: { control: 'radio', options: ['static', 'removable', 'selectable'] },
    children: { control: 'text' },
    size: { control: 'select', options: ['less', 'normal', 'more'] },
    hasIcon: { control: 'boolean' },
    // Only a toggle has a selected state, and a label can't be disabled
    isSelected: { control: 'boolean', if: { arg: 'kind', eq: 'selectable' } },
    isDisabled: { control: 'boolean', if: { arg: 'kind', neq: 'static' } },
  },
  parameters: {
    // The component's own props are not the story's; these are
    controls: { include: ['kind', 'children', 'size', 'hasIcon', 'isSelected', 'isDisabled'] },
    ...showCode(
      `<Chip>Beta</Chip>
<Chip onRemove={() => {}}>Design</Chip>
<Chip isSelected={isSelected} onSelectedChange={setIsSelected}>Design</Chip>`,
      { hasControls: true },
    ),
  },
  // Changing a control starts the chip over, so its clicked state doesn't outlive the control
  render: (args) => <Playground key={`${args.kind}-${args.isSelected}`} {...args} />,
};

/** A chip with no handler is a label: a status word, a category. Outlined, and it does nothing. */
export const Static: Story = {
  args: { children: 'Beta' },
};

export const Size: Story = {
  parameters: showCode(
    ['less', 'normal', 'more']
      .map((v) => `<Chip size="${v}" onRemove={...}>size="${v}"</Chip>`)
      .join('\n'),
  ),
  render: () => (
    <Row>
      {(['less', 'normal', 'more'] as const).map((v) => (
        <Chip key={v} size={v} onRemove={() => {}}>
          {`size="${v}"`}
        </Chip>
      ))}
    </Row>
  ),
};

export const WithIcon: Story = {
  args: { children: 'Favourite', icon: <StarIcon />, onRemove: () => {} },
};

/** `size="1em"` takes the size of the text around it. */
export const InText: Story = {
  parameters: showCode(`<p>This feature is <Chip size="1em">Beta</Chip> for now.</p>`),
  render: () => (
    <p style={{ padding: '1rem', fontSize: '1.25rem' }}>
      This feature is <Chip size="1em">Beta</Chip> for now.
    </p>
  ),
};

/** Removable chips go away when the caller stops rendering them. */
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

/**
 * `isSelected` and `onSelectedChange` make a toggle, a real button with `aria-pressed`. Off it has the
 * field fill, as Checkbox and Toggle do; on it is the brand color, with a ✓ in place of the icon so
 * the state is not color alone. A chip is removable or selectable, never both.
 */
export const Selectable: Story = {
  parameters: showCode(`const [on, setOn] = useState(['Design']);

{['Design', 'Research', 'Web'].map((topic) => (
  <Chip
    key={topic}
    isSelected={on.includes(topic)}
    onSelectedChange={(isSelected) =>
      setOn(isSelected ? [...on, topic] : on.filter((t) => t !== topic))
    }
  >
    {topic}
  </Chip>
))}`),
  render: () => <SelectableChips />,
};

function SelectableChips() {
  const [on, setOn] = useState(['Design']);
  return (
    <Row>
      {['Design', 'Research', 'Web'].map((topic) => (
        <Chip
          key={topic}
          isSelected={on.includes(topic)}
          onSelectedChange={(isSelected) =>
            setOn(isSelected ? [...on, topic] : on.filter((t) => t !== topic))
          }
        >
          {topic}
        </Chip>
      ))}
    </Row>
  );
}

/** A selected chip's ✓ replaces its icon, so the icon comes back when it is deselected. */
export const SelectableWithIcon: Story = {
  parameters: showCode(
    `<Chip icon={<StarIcon />} isSelected={isSelected} onSelectedChange={setIsSelected}>Favourite</Chip>`,
  ),
  render: () => <SelectableWithIconDemo />,
};

function SelectableWithIconDemo() {
  const [isSelected, setIsSelected] = useState(false);
  return (
    <Row>
      <Chip icon={<StarIcon />} isSelected={isSelected} onSelectedChange={setIsSelected}>
        Favourite
      </Chip>
    </Row>
  );
}

/** Dimmed, with no hover or press. A disabled removable chip also loses its ×. */
export const Disabled: Story = {
  parameters: showCode(`<Chip isDisabled onRemove={...}>Locked</Chip>
<Chip isDisabled isSelected={false} onSelectedChange={...}>Off</Chip>
<Chip isDisabled isSelected onSelectedChange={...}>On</Chip>`),
  render: () => (
    <Row>
      <Chip isDisabled onRemove={() => {}}>
        Locked
      </Chip>
      <Chip isDisabled isSelected={false} onSelectedChange={() => {}}>
        Off
      </Chip>
      <Chip isDisabled isSelected onSelectedChange={() => {}}>
        On
      </Chip>
    </Row>
  ),
};

/**
 * All the kinds side by side. The rule: an outline is information, a fill is something you can press,
 * and the brand color is what is on.
 */
export const States: Story = {
  parameters: showCode(`<Chip>Static</Chip>
<Chip onRemove={...}>Removable</Chip>
<Chip isSelected={false} onSelectedChange={...}>Selectable</Chip>
<Chip isSelected onSelectedChange={...}>Selected</Chip>`),
  render: () => (
    <Row>
      <Chip>Static</Chip>
      <Chip onRemove={() => {}}>Removable</Chip>
      <Chip isSelected={false} onSelectedChange={() => {}}>
        Selectable
      </Chip>
      <Chip isSelected onSelectedChange={() => {}}>
        Selected
      </Chip>
    </Row>
  ),
};

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
