import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { asControlled, showCode } from '../../../.storybook/snippet';
import { today, type LocalDate } from '../_shared/dateValue';
import { addDays } from '../Calendar/calendarMath';
import { Stack } from '../Stack';
import { DatePicker, DATEPICKER_DEFAULTS } from './DatePicker';

const VARIANTS = ['less', 'normal', 'more'] as const;

// A story needs somewhere to keep the date to show it. `value` is where it starts.
const Stateful = ({ value: initial, onChange, ...args }: ComponentProps<typeof DatePicker>) => {
  const [value, setValue] = useState<LocalDate | null>(initial ?? null);
  return (
    <DatePicker
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

const meta: Meta<typeof DatePicker> = {
  title: 'Inputs/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...DATEPICKER_DEFAULTS, label: 'Due date' },
  render: (args) => <Stateful {...args} />,
  parameters: {
    docs: {
      source: {
        transform: asControlled(DATEPICKER_DEFAULTS, {
          as: 'DatePicker',
          prop: 'value',
          setter: 'setValue',
        }),
      },
    },
  },
  decorators: [
    (Story) => (
      // Room under the field for the popup, which is in the top layer but sizes the docs frame no more
      <div style={{ width: '24rem', maxWidth: '100%', minHeight: '28rem', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: DATEPICKER_DEFAULTS.size } },
    },
    locale: { control: 'text' },
    firstDayOfWeek: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6] },
    isDisabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    isReadOnly: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    isRequired: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    onChange: { action: 'changed' },
    onOpenChange: { action: 'open changed' },
  },
};
export default meta;
type Story = StoryObj<typeof DatePicker>;

/**
 * A date field with a calendar button at its end. Type it, or press the button (Alt+Down in the field
 * does the same) and choose a day; the calendar follows what is typed. Choosing closes it.
 */
export const Default: Story = {};

export const Size: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '24rem', maxWidth: '100%', minHeight: '34rem', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: showCode(
    VARIANTS.map(
      (v) =>
        `<DatePicker size="${v}" label="size=&quot;${v}&quot;" value={value} onChange={setValue} />`,
    ).join('\n'),
  ),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Stateful key={v} size={v} label={`size="${v}"`} value="2026-11-11" />
      ))}
    </Stack>
  ),
};

/** Shortcuts under the calendar. Compute the dates when you render, so "Today" is today. */
export const Presets: Story = {
  parameters: showCode(
    `<DatePicker
  label="Due date"
  value={value}
  onChange={setValue}
  presets={[
    { label: 'Today', value: today() },
    { label: 'Tomorrow', value: addDays(today(), 1) },
    { label: 'In a week', value: addDays(today(), 7) },
  ]}
/>`,
  ),
  render: (args) => (
    <Stateful
      {...args}
      presets={[
        { label: 'Today', value: today() },
        { label: 'Tomorrow', value: addDays(today(), 1) },
        { label: 'In a week', value: addDays(today(), 7) },
      ]}
    />
  ),
};

/**
 * `min`, `max` and `isDateDisabled` limit the calendar and the presets, not what is typed: check the
 * typed date yourself (`value < today()` compares as dates do) and say so with `error`.
 */
export const Limits: Story = {
  parameters: showCode(
    `<DatePicker
  label="Pick-up"
  value={value}
  onChange={setValue}
  min={today()}
  max={addDays(today(), 30)}
  error={value && (value < today() || value > addDays(today(), 30)) ? 'Choose a day in the next 30 days' : undefined}
/>`,
  ),
  render: function Render() {
    const [value, setValue] = useState<LocalDate | null>(null);
    const last = addDays(today(), 30);
    return (
      <DatePicker
        label="Pick-up"
        locale="en-GB"
        value={value}
        onChange={setValue}
        min={today()}
        max={last}
        presets={[{ label: 'Today', value: today() }]}
        error={
          value && (value < today() || value > last)
            ? 'Choose a day in the next 30 days'
            : undefined
        }
      />
    );
  },
};

export const DisabledDates: Story = {
  parameters: showCode(
    `<DatePicker
  label="Delivery"
  value={value}
  onChange={setValue}
  isDateDisabled={(date) => isWeekend(date)}
/>`,
  ),
  render: (args) => (
    <Stateful
      {...args}
      label="Delivery (not on weekends)"
      isDateDisabled={(date) => {
        const weekday = new Date(`${date}T12:00:00`).getDay();
        return weekday === 0 || weekday === 6;
      }}
    />
  ),
};

export const Labels: Story = {
  parameters: showCode(
    `<DatePicker
  locale="fr-FR"
  label="Date de départ"
  labels={{
    calendar: 'Choisir une date',
    day: 'Jour', month: 'Mois', year: 'Année', empty: 'vide',
    previous: () => 'Précédent', next: () => 'Suivant',
  }}
  placeholders={{ day: 'jj', month: 'mm', year: 'aaaa' }}
/>`,
  ),
  render: () => (
    <Stateful
      locale="fr-FR"
      label="Date de départ"
      labels={{
        calendar: 'Choisir une date',
        day: 'Jour',
        month: 'Mois',
        year: 'Année',
        empty: 'vide',
        previous: (view) =>
          ({ days: 'Mois précédent', months: 'Année précédente', years: 'Années précédentes' })[
            view
          ],
        next: (view) =>
          ({ days: 'Mois suivant', months: 'Année suivante', years: 'Années suivantes' })[view],
      }}
      placeholders={{ day: 'jj', month: 'mm', year: 'aaaa' }}
    />
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true, value: '2026-11-11' },
};

export const ReadOnly: Story = {
  args: { isReadOnly: true, value: '2026-11-11' },
};
