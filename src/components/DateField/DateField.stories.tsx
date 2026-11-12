import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { asControlled, showCode } from '../../../.storybook/snippet';
import { today, type LocalDate } from '../_shared/dateValue';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { DateField, DATEFIELD_DEFAULTS } from './DateField';

const VARIANTS = ['less', 'normal', 'more'] as const;

// A story needs somewhere to keep the date to show it. `value` is where it starts.
const Stateful = ({ value: initial, onChange, ...args }: ComponentProps<typeof DateField>) => {
  const [value, setValue] = useState<LocalDate | null>(initial ?? null);
  return (
    <DateField
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

const meta: Meta<typeof DateField> = {
  title: 'Inputs/DateField',
  component: DateField,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...DATEFIELD_DEFAULTS, label: 'Date of birth' },
  render: (args) => <Stateful {...args} />,
  parameters: {
    docs: {
      source: {
        transform: asControlled(DATEFIELD_DEFAULTS, {
          as: 'DateField',
          prop: 'value',
          setter: 'setValue',
        }),
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem', maxWidth: '100%', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: DATEFIELD_DEFAULTS.size } },
    },
    locale: { control: 'text' },
    isDisabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    isReadOnly: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    isRequired: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof DateField>;

/**
 * For a date you know by heart, a birthday: type the digits and it moves on by itself (`14031988`), the
 * arrow keys step a segment, and a pasted date fills all three. No calendar to walk back through.
 */
export const Default: Story = {};

export const WithTooltip: Story = {
  args: { tooltip: 'We use it to check your age, and never show it.' },
};

export const Size: Story = {
  parameters: showCode(
    VARIANTS.map(
      (v) =>
        `<DateField size="${v}" label="size=&quot;${v}&quot;" value={value} onChange={setValue} />`,
    ).join('\n'),
  ),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Stateful key={v} size={v} label={`size="${v}"`} value="1988-03-14" />
      ))}
    </Stack>
  ),
};

/** The order and the separators are the locale's: month first in the US, year first in Japan. */
export const Locales: Story = {
  parameters: showCode(
    `<DateField locale="en-US" label="en-US" value={value} onChange={setValue} />
<DateField locale="de-DE" label="de-DE" value={value} onChange={setValue} />
<DateField locale="ja-JP" label="ja-JP" value={value} onChange={setValue} />`,
  ),
  render: () => (
    <Stack>
      {['en-US', 'de-DE', 'ja-JP', 'ko-KR'].map((locale) => (
        <Stateful key={locale} locale={locale} label={locale} value="1988-03-14" />
      ))}
    </Stack>
  ),
};

/**
 * The field does not decide what is wrong; the caller does, when the person leaves it, and says so with
 * `error`. `onChange` gives `null` for a date that is not finished, or not a date (31 February), so an
 * empty field and a half-typed one are both "enter a date".
 */
export const Validation: Story = {
  parameters: showCode(
    `const [value, setValue] = useState<LocalDate | null>(null);
const [touched, setTouched] = useState(false);

<DateField
  label="Date of birth"
  value={value}
  onChange={setValue}
  onBlur={() => setTouched(true)}
  error={touched && !value ? 'Enter a date, like 14/03/1988' : touched && value > today() ? 'That is in the future' : undefined}
/>`,
  ),
  render: function Render() {
    const [value, setValue] = useState<LocalDate | null>(null);
    const [touched, setTouched] = useState(false);
    const error = !touched
      ? undefined
      : !value
        ? 'Enter a date, like 14/03/1988'
        : value > today()
          ? 'That is in the future'
          : undefined;
    return (
      <DateField
        label="Date of birth"
        locale="en-GB"
        isRequired
        value={value}
        onChange={setValue}
        onBlur={() => setTouched(true)}
        error={error}
      />
    );
  },
};

export const Labels: Story = {
  parameters: showCode(
    `<DateField
  locale="de-DE"
  label="Geburtsdatum"
  labels={{ day: 'Tag', month: 'Monat', year: 'Jahr', empty: 'leer' }}
  placeholders={{ day: 'TT', month: 'MM', year: 'JJJJ' }}
/>`,
  ),
  render: () => (
    <Stateful
      locale="de-DE"
      label="Geburtsdatum"
      labels={{ day: 'Tag', month: 'Monat', year: 'Jahr', empty: 'leer' }}
      placeholders={{ day: 'TT', month: 'MM', year: 'JJJJ' }}
    />
  ),
};

/** `name` submits the date as `1988-03-14` (or nothing), so it works in a plain `<form>`. */
export const InAForm: Story = {
  parameters: showCode(
    `<form onSubmit={...}>
  <DateField name="birthday" label="Date of birth" />
  <button>Save</button>
</form>`,
  ),
  render: function Render() {
    const [sent, setSent] = useState('');
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSent(String(new FormData(event.currentTarget).get('birthday')));
        }}
      >
        <Stack>
          <DateField name="birthday" label="Date of birth" locale="en-GB" />
          <button type="submit">Save</button>
          <Text>Submitted: {sent === '' ? 'nothing yet' : sent}</Text>
        </Stack>
      </form>
    );
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, value: '1988-03-14' },
};

export const ReadOnly: Story = {
  args: { isReadOnly: true, value: '1988-03-14' },
};
