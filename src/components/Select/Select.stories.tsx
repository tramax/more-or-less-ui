import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, SELECT_DEFAULTS, type SelectOption } from './Select';

// Escape-hatch values are free-form, so a select can't show them
const textControl = { control: 'text' } as const;

const VARIANTS = ['less', 'normal', 'more'] as const;

const FRUITS: SelectOption[] = [
  { value: 'apple', label: 'Apple (Freshly Picked From the Tree)' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
];

const WITH_DESCRIPTIONS: SelectOption[] = [
  { value: 'free', label: 'Free', description: 'One project, community support' },
  { value: 'team', label: 'Team', description: 'Unlimited projects, email support' },
  { value: 'enterprise', label: 'Enterprise', description: 'Single sign-on, a named contact' },
  { value: 'legacy', label: 'Legacy', description: 'No longer offered', isDisabled: true },
];

const COUNTRIES = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'Colombia',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'India',
  'Indonesia',
  'Ireland',
  'Italy',
  'Japan',
  'Kenya',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Peru',
  'Poland',
  'Portugal',
  'Spain',
  'Sweden',
  'Switzerland',
  'Vietnam',
].map((label) => ({ value: label.toLowerCase().replace(/\s/g, '-'), label }));

// The Size story renders all three variants at once, so its controls would do nothing. Its render
// returns <Sizes>, which Storybook can't turn into <Select> code, so spell the snippet out.
const comparison = {
  controls: { disable: true },
  docs: {
    source: {
      code: VARIANTS.map(
        (v) => `<Select size="${v}" label="size=&quot;${v}&quot;" options={options} />`,
      ).join('\n\n'),
      transform: (code: string) => code,
    },
  },
};

const Column = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
    {children}
  </div>
);

// Drop props that are at their default from the code snippet, so a bare `<Select>` shows as such
const omitDefaults = (code: string) =>
  Object.entries(SELECT_DEFAULTS).reduce(
    (c, [prop, value]) => c.replace(new RegExp(String.raw`\s+${prop}="${value}"`, 'g'), ''),
    code,
  );

const meta: Meta<typeof Select> = {
  title: 'Inputs/Select',
  component: Select,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...SELECT_DEFAULTS, label: 'Fruit', options: FRUITS },
  parameters: { docs: { source: { transform: omitDefaults } } },
  decorators: [
    (Story) => (
      <div style={{ width: '18rem', maxWidth: '100%', padding: '1rem', minHeight: '22rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: SELECT_DEFAULTS.size } },
    },
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: { placeholder: 'Choose a fruit' },
};

export const WithDescriptions: Story = {
  args: { label: 'Plan', options: WITH_DESCRIPTIONS, defaultValue: 'team' },
};

export const Size: Story = {
  parameters: comparison,
  render: () => (
    <Column>
      {VARIANTS.map((v) => (
        <Select key={v} size={v} label={`size="${v}"`} options={FRUITS} defaultValue="banana" />
      ))}
    </Column>
  ),
};

/**
 * `isSearchable` turns the control into an input that filters the list. The value is still always
 * one of the options: the typed text is only a filter, and goes back to the selected label when the
 * list closes.
 */
export const Searchable: Story = {
  args: { isSearchable: true, label: 'Country', options: COUNTRIES, placeholder: 'Search…' },
};

/** Any number of options, shown as chips. The list stays open between picks. */
export const Multiple: Story = {
  args: {
    isMultiple: true,
    label: 'Fruit',
    placeholder: 'Choose fruit',
    defaultValue: ['banana', 'fig'],
  },
};

export const MultipleSearchable: Story = {
  args: {
    isMultiple: true,
    isSearchable: true,
    label: 'Countries visited',
    options: COUNTRIES,
    placeholder: 'Search…',
    defaultValue: ['peru', 'japan'],
  },
};

/** Chips wrap, and the field grows with them. */
export const ManyChips: Story = {
  args: {
    isMultiple: true,
    label: 'Countries visited',
    options: COUNTRIES,
    defaultValue: COUNTRIES.slice(0, 12).map((c) => c.value),
  },
};

const ControlledSelect = () => {
  const [value, setValue] = useState<string | null>('cherry');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Select label="Fruit" options={FRUITS} value={value} onChange={setValue} />
      <button type="button" onClick={() => setValue(null)}>
        Clear (value=null)
      </button>
      <output>value: {String(value)}</output>
    </div>
  );
};

/** `null` is the explicit "nothing selected"; the user can't clear a single Select. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ControlledSelect />,
};

export const Required: Story = {
  args: { isRequired: true, placeholder: 'Choose a fruit' },
};

export const Invalid: Story = {
  args: { error: 'Choose a fruit', placeholder: 'Choose a fruit' },
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'apple' },
};

export const DisabledOption: Story = {
  args: {
    options: FRUITS.map((o) => (o.value === 'cherry' ? { ...o, isDisabled: true } : o)),
  },
};

/** Near the bottom of its container the list flips above the field. */
export const FlipsAtTheEdge: Story = {
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'flex-end', padding: '1rem' }}>
        <div style={{ width: '24rem' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  args: { options: COUNTRIES, label: 'Country' },
};

/** A narrow field makes a narrow popup: long labels wrap instead of running under the tick. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '6rem' }}>
        <Story />
      </div>
    ),
  ],
  args: { defaultValue: 'elderberry', isRequired: true },
};

export const EscapeHatch: Story = {
  argTypes: { size: textControl },
  args: { size: '1.5rem' },
};
