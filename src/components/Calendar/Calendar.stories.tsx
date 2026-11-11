import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { asControlled, showCode } from '../../../.storybook/snippet';
import {
  fromInstant,
  toInstant,
  today,
  type LocalDate,
  type LocalDateTime,
  type LocalMonth,
} from '../_shared/dateValue';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { addDays, addMonths } from './calendarMath';
import { Calendar, CALENDAR_DEFAULTS } from './Calendar';

const VARIANTS = ['less', 'normal', 'more'] as const;

// A story needs somewhere to keep the date to show it. `value` is where it starts.
const Stateful = ({ value: initial, onChange, ...args }: ComponentProps<typeof Calendar>) => {
  const [value, setValue] = useState<LocalDate | null>(initial ?? null);
  return (
    <Calendar
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

const meta: Meta<typeof Calendar> = {
  title: 'Inputs/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...CALENDAR_DEFAULTS },
  render: (args) => <Stateful {...args} />,
  parameters: {
    docs: {
      source: {
        transform: asControlled(CALENDAR_DEFAULTS, {
          as: 'Calendar',
          prop: 'value',
          setter: 'setValue',
        }),
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: CALENDAR_DEFAULTS.size } },
    },
    isDisabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    firstDayOfWeek: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6] },
    locale: { control: 'text' },
    'aria-label': { control: 'text', table: { defaultValue: { summary: 'Calendar' } } },
    onChange: { action: 'changed' },
    onVisibleMonthChange: { action: 'month changed' },
  },
};
export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {};

export const Size: Story = {
  parameters: showCode(
    VARIANTS.map((v) => `<Calendar size="${v}" value={value} onChange={setValue} />`).join('\n'),
  ),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Stateful key={v} size={v} value="2026-11-11" />
      ))}
    </Stack>
  ),
};

/**
 * The name in the header opens the months, and the year in that opens the years: a birthday decades back
 * is three presses (the year page, the year, the month), not a hundred and fifty months. Try it from the
 * name: the arrow keys walk the grids, Page Up and Down turn them, Escape goes back a step.
 */
export const Birthday: Story = {
  args: { 'aria-label': 'Date of birth' },
  parameters: showCode(
    `<Calendar aria-label="Date of birth" value={value} onChange={setValue} max={today()} />`,
  ),
  render: (args) => <Stateful {...args} max={today()} />,
};

/** `min` and `max` dim the dates outside them, stop the buttons at the edge, and dim the months and years that are out. */
export const Limits: Story = {
  parameters: showCode(
    `<Calendar
  value={value}
  onChange={setValue}
  min={today()}
  max={addDays(today(), 30)}
/>`,
  ),
  render: (args) => <Stateful {...args} min={today()} max={addDays(today(), 30)} />,
};

/** A date that is taken (a booked day, a day off) is dimmed and can't be chosen, but the keyboard still passes over it. */
export const DisabledDates: Story = {
  parameters: showCode(
    `<Calendar
  value={value}
  onChange={setValue}
  isDateDisabled={(date) => isWeekend(date)}
/>`,
  ),
  render: (args) => (
    <Stateful
      {...args}
      isDateDisabled={(date) => {
        const day = new Date(
          Number(date.slice(0, 4)),
          Number(date.slice(5, 7)) - 1,
          Number(date.slice(8)),
        ).getDay();
        return day === 0 || day === 6;
      }}
    />
  ),
};

/** The first column follows the locale; `firstDayOfWeek` (0 is Sunday) overrides it. */
export const FirstDayOfWeek: Story = {
  parameters: showCode(`<Calendar firstDayOfWeek={0} value={value} onChange={setValue} />`),
  render: (args) => <Stateful {...args} firstDayOfWeek={0} />,
};

/** The names of the months and days, and a screen reader's date, are the locale's. */
export const Locales: Story = {
  parameters: showCode(
    ['fr-FR', 'ja-JP', 'ar-EG']
      .map((locale) => `<Calendar locale="${locale}" value={value} onChange={setValue} />`)
      .join('\n'),
  ),
  render: () => (
    <Stack>
      {['fr-FR', 'ja-JP', 'ar-EG'].map((locale) => (
        <Stateful key={locale} locale={locale} value="2026-11-11" />
      ))}
    </Stack>
  ),
};

/** The buttons' names change what a screen reader says, not what is drawn. */
export const Labels: Story = {
  parameters: showCode(
    `<Calendar
  value={value}
  onChange={setValue}
  aria-label="Calendrier"
  locale="fr-FR"
  labels={{
    previous: (view) => ({ days: 'Mois précédent', months: 'Année précédente', years: 'Années précédentes' })[view],
    next: (view) => ({ days: 'Mois suivant', months: 'Année suivante', years: 'Années suivantes' })[view],
  }}
/>`,
  ),
  render: (args) => (
    <Stateful
      {...args}
      aria-label="Calendrier"
      locale="fr-FR"
      labels={{
        previous: (view) =>
          ({ days: 'Mois précédent', months: 'Année précédente', years: 'Années précédentes' })[
            view
          ],
        next: (view) =>
          ({ days: 'Mois suivant', months: 'Année suivante', years: 'Années suivantes' })[view],
      }}
    />
  ),
};

/**
 * `visibleMonth` makes the month the parent's. Two calendars one month apart is what a range picker is
 * made of: pressing either's arrows moves both.
 */
export const TwoMonths: Story = {
  parameters: showCode(
    `const [month, setMonth] = useState<LocalMonth>('2026-11');

<Calendar visibleMonth={month} onVisibleMonthChange={setMonth} />
<Calendar visibleMonth={nextMonth(month)} onVisibleMonthChange={(m) => setMonth(previousMonth(m))} />`,
  ),
  render: function Render() {
    const [month, setMonth] = useState<LocalMonth>(today().slice(0, 7) as LocalMonth);
    const shift = (m: LocalMonth, by: number) =>
      addMonths(`${m}-01` as LocalDate, by).slice(0, 7) as LocalMonth;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        <Stateful aria-label="First month" visibleMonth={month} onVisibleMonthChange={setMonth} />
        <Stateful
          aria-label="Second month"
          visibleMonth={shift(month, 1)}
          onVisibleMonthChange={(m) => setMonth(shift(m, -1))}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, value: '2026-11-11' },
};

const ZONES = ['Europe/Paris', 'America/New_York', 'Asia/Kolkata', 'Pacific/Auckland'];

/**
 * The calendar gives a `LocalDate`: a calendar date, not a moment. Send a birthday or a due date as it
 * is. A date **with a time** is a wall-clock reading in some place, and a server that wants an instant
 * needs that place: `toInstant(value, timeZone)`. And the other way, `fromInstant`. See "Date and time
 * values" in DESIGN.md.
 */
export const SendingToAServer: Story = {
  parameters: showCode(
    `const date = '2026-11-11'; // from the calendar: send it as it is (a DATE column)

// A date and a time together are a wall clock, in a place:
const value: LocalDateTime = \`\${date}T14:30\`;
toInstant(value);                      // the browser's zone
toInstant(value, 'Europe/Paris');      // the restaurant's zone: '2026-11-11T13:30:00.000Z'

// Receiving one: never value={booking.startsAt}
fromInstant('2026-11-11T13:30:00.000Z', 'Europe/Paris'); // '2026-11-11T14:30'`,
  ),
  render: function Render() {
    const [date, setDate] = useState<LocalDate>('2026-11-11');
    const [time, setTime] = useState('14:30');
    const [zone, setZone] = useState(ZONES[0]!);
    const value = `${date}T${time}` as LocalDateTime;
    const instant = toInstant(value, zone);
    return (
      <Stack>
        <Calendar value={date} onChange={setDate} />
        <label>
          Time{' '}
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value || '00:00')}
          />
        </label>
        <label>
          Where the clock is{' '}
          <select value={zone} onChange={(event) => setZone(event.target.value)}>
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </label>
        <Text>
          Date, send as it is: <code>{date}</code>
        </Text>
        <Text>
          Wall clock: <code>{value}</code>
        </Text>
        <Text>
          Instant for a server: <code>{instant}</code>
        </Text>
        <Text>
          Back, in {zone}: <code>{fromInstant(instant, zone)}</code>
        </Text>
      </Stack>
    );
  },
};
