import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
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

// An option's `icon` is any node; an svg or an img fills its square. A coloured disc with initials
// stands in for an avatar image here.
const Avatar = ({ name, hue }: { name: string; hue: number }) => (
  <svg viewBox="0 0 20 20" role="img" aria-label="">
    <circle cx="10" cy="10" r="10" fill={`oklch(0.62 0.15 ${hue})`} />
    <text x="10" y="10" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="white">
      {name
        .split(' ')
        .map((part) => part[0])
        .join('')}
    </text>
  </svg>
);

const PEOPLE: SelectOption[] = [
  { value: 'ada', label: 'Ada Lovelace', description: 'ada@analytical.example' },
  { value: 'alan', label: 'Alan Turing', description: 'alan@bletchley.example' },
  { value: 'grace', label: 'Grace Hopper', description: 'grace@navy.example' },
  { value: 'katherine', label: 'Katherine Johnson', description: 'kj@nasa.example' },
  { value: 'margaret', label: 'Margaret Hamilton', description: 'margaret@apollo.example' },
  { value: 'edsger', label: 'Edsger Dijkstra', description: 'ewd@tue.example' },
  { value: 'barbara', label: 'Barbara Liskov', description: 'liskov@mit.example' },
  { value: 'donald', label: 'Donald Knuth', description: 'knuth@stanford.example' },
  { value: 'hedy', label: 'Hedy Lamarr', description: 'hedy@spread-spectrum.example' },
  { value: 'tim', label: 'Tim Berners-Lee', description: 'timbl@cern.example' },
];

const PEOPLE_WITH_AVATARS: SelectOption[] = PEOPLE.map((person, i) => ({
  ...person,
  icon: <Avatar name={person.label} hue={i * 47} />,
}));

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

const meta: Meta<typeof Select> = {
  title: 'Inputs/Select',
  component: Select,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...SELECT_DEFAULTS, label: 'Fruit', options: FRUITS },
  parameters: { docs: { source: { transform: omitDefaults(SELECT_DEFAULTS) } } },
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

/**
 * An option's `icon` is shown before its text: in the list, in the closed field, and on a chip. It
 * is decorative (hidden from assistive tech), so `label` is still the name. Checkbox and Radio
 * options take `icon` too.
 */
export const WithIcons: Story = {
  args: { label: 'Assignee', options: PEOPLE_WITH_AVATARS, defaultValue: 'grace' },
};

/** The icon sits over the input and goes while the user types, since the text no longer names it. */
export const WithIconsSearchable: Story = {
  args: {
    label: 'Assignee',
    options: PEOPLE_WITH_AVATARS,
    isSearchable: true,
    defaultValue: 'ada',
  },
};

export const WithIconsMultiple: Story = {
  args: {
    label: 'Assignees',
    options: PEOPLE_WITH_AVATARS,
    isMultiple: true,
    defaultValue: ['ada', 'alan'],
  },
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

/**
 * `isClearable` adds a button that empties the field (`onChange` gets `null`, or `[]` for a multiple
 * one). Backspace does too, when there is nothing to type. Hidden while required or disabled.
 */
export const Clearable: Story = {
  args: { isClearable: true, placeholder: 'Choose a fruit', defaultValue: 'banana' },
};

export const ClearableMultiple: Story = {
  args: {
    isMultiple: true,
    isClearable: true,
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

/** `null` is the explicit "nothing selected"; the user can't clear a single Select without `isClearable`. */
export const Controlled: Story = {
  parameters: showCode(`const [value, setValue] = useState<string | null>('cherry');

<Select label="Fruit" options={options} value={value} onChange={setValue} />
<button onClick={() => setValue(null)}>Clear</button>`),
  render: () => <ControlledSelect />,
};

// Stands in for a request. Matches the name or the email, as a server would, so a result's label
// needn't contain what was typed.
const searchPeople = (query: string, signal: AbortSignal) =>
  new Promise<SelectOption[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      const needle = query.toLowerCase();
      resolve(PEOPLE.filter((p) => `${p.label} ${p.description}`.toLowerCase().includes(needle)));
    }, 600);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

/**
 * What a caller writes around `onSearch`: wait for a pause in typing (debounce), drop the request
 * the next keystroke makes stale (abort), and show `isLoading` meanwhile. The Select does none of
 * this itself. `onSearch` gets `''` when the text is reset, which is where the suggestions come back.
 */
const useSearch = (suggestions: SelectOption[]) => {
  const [options, setOptions] = useState(suggestions);
  const [isLoading, setIsLoading] = useState(false);
  const pending = useRef<{ timer?: number; controller?: AbortController }>({});

  const cancel = () => {
    window.clearTimeout(pending.current.timer);
    pending.current.controller?.abort();
  };
  useEffect(() => cancel, []);

  const onSearch = (query: string) => {
    cancel();
    if (!query.trim()) {
      setOptions(suggestions);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    pending.current.timer = window.setTimeout(() => {
      const controller = new AbortController();
      pending.current.controller = controller;
      searchPeople(query, controller.signal).then(
        (found) => {
          setOptions(found);
          setIsLoading(false);
        },
        (error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setIsLoading(false);
        },
      );
    }, 250);
  };

  return { options, isLoading, onSearch };
};

const AsyncSelect = () => {
  const search = useSearch(PEOPLE.slice(0, 4));
  const [value, setValue] = useState<string | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Select
        label="Assignee"
        placeholder="Search people…"
        isClearable
        {...search}
        value={value}
        onChange={setValue}
      />
      <output>value: {String(value)}</output>
    </div>
  );
};

/**
 * `onSearch` is for options that are fetched by what is typed. It makes the Select searchable and
 * stops it filtering: `options` are the matches, whatever they matched on (try an email address).
 * Selected options are remembered, so the value stays shown when a new search replaces the list.
 * Debounce and abort are the caller's, here in `useSearch`; `isLoading` shows "Loading…".
 */
export const AsyncSearch: Story = {
  parameters:
    showCode(`// useSearch is the caller's: debounce, abort and isLoading (see the story source)
const search = useSearch(suggestions);
const [value, setValue] = useState<string | null>(null);

<Select
  label="Assignee"
  placeholder="Search people…"
  isClearable
  {...search} // options, isLoading, onSearch
  value={value}
  onChange={setValue}
/>`),
  render: () => <AsyncSelect />,
};

const AsyncMultipleSelect = () => {
  const search = useSearch(PEOPLE.slice(0, 4));
  const [value, setValue] = useState<string[]>(['ada']);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Select
        label="Reviewers"
        placeholder="Search people…"
        isMultiple
        {...search}
        value={value}
        onChange={setValue}
      />
      <output>value: {JSON.stringify(value)}</output>
    </div>
  );
};

/**
 * The chips stay while the list changes under them, and values are in the order they were picked
 * (there is no stable `options` order across searches). Ada is selected from the start, so her
 * option is in the first list: a value selected on first render needs that.
 */
export const AsyncSearchMultiple: Story = {
  parameters: showCode(`const search = useSearch(suggestions);
const [value, setValue] = useState<string[]>(['ada']);

<Select
  label="Reviewers"
  placeholder="Search people…"
  isMultiple
  {...search} // options, isLoading, onSearch
  value={value}
  onChange={setValue}
/>`),
  render: () => <AsyncMultipleSelect />,
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
