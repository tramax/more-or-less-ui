import type { KeyboardEvent } from 'react';
import { clsx } from '@/utils/clsx';
import type { LocalDate } from '../_shared/dateValue';
import round from '../_shared/RoundControl.module.css';
import {
  addDays,
  addMonths,
  addYears,
  endOfWeek,
  getMonthGrid,
  sameMonth,
  startOfWeek,
} from './calendarMath';
import type { Weekday } from './calendarMath';
import styles from './Calendar.module.css';

export type DayFormats = {
  /** The number on a day's cell. */
  day: (date: LocalDate) => string;
  /** What a screen reader says for a day: "Wednesday, November 11, 2026". */
  full: (date: LocalDate) => string;
  /** The short and the full name of a weekday, for the column headers. */
  weekday: (weekday: Weekday) => { short: string; long: string };
};

/**
 * The month as a grid of dates (APG's date picker grid): six rows of seven, with the days either side of
 * the month dimmed, one date in the tab order, and the keys of the pattern: arrows by a day or a week,
 * Home and End by the week, Page Up and Down by a month (with Shift, a year).
 */
export function DayGrid({
  month,
  focused,
  selected,
  today,
  firstDay,
  formats,
  labelledBy,
  isDisabled,
  isUnavailable,
  onPick,
  onMove,
}: {
  /** Any date in the month shown. */
  month: LocalDate;
  focused: LocalDate;
  selected: LocalDate | null;
  today: LocalDate;
  firstDay: Weekday;
  formats: DayFormats;
  labelledBy: string;
  isDisabled: boolean;
  /** Outside `min` / `max`, or refused by `isDateDisabled`: still reachable by keyboard, but not chosen. */
  isUnavailable: (date: LocalDate) => boolean;
  onPick: (date: LocalDate) => void;
  /** The keyboard wants the focus on this date. */
  onMove: (date: LocalDate) => void;
}) {
  const weeks = getMonthGrid(month, firstDay);

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    // The arrows follow the reading direction, as the pattern does for a right-to-left page
    const isRtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const sideways = isRtl ? -1 : 1;
    const next: LocalDate | undefined = {
      ArrowLeft: addDays(focused, -sideways),
      ArrowRight: addDays(focused, sideways),
      ArrowUp: addDays(focused, -7),
      ArrowDown: addDays(focused, 7),
      Home: startOfWeek(focused, firstDay),
      End: endOfWeek(focused, firstDay),
      PageUp: event.shiftKey ? addYears(focused, -1) : addMonths(focused, -1),
      PageDown: event.shiftKey ? addYears(focused, 1) : addMonths(focused, 1),
    }[event.key];
    if (!next) return;
    event.preventDefault();
    onMove(next);
  };

  return (
    <table
      role="grid"
      aria-labelledby={labelledBy}
      className={styles.days}
      onKeyDown={handleKeyDown}
    >
      <thead>
        <tr>
          {Array.from({ length: 7 }, (_, i) => {
            const { short, long } = formats.weekday(((firstDay + i) % 7) as Weekday);
            return (
              <th key={i} scope="col" abbr={long} className={styles.weekday}>
                {short}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]}>
            {week.map((date) => {
              const isSelected = date === selected;
              const unavailable = isUnavailable(date);
              return (
                <td
                  key={date}
                  role="gridcell"
                  aria-selected={isSelected}
                  className={styles.dayCell}
                >
                  <button
                    type="button"
                    data-cell=""
                    data-key={date}
                    aria-label={formats.full(date)}
                    aria-current={date === today ? 'date' : undefined}
                    aria-disabled={unavailable || undefined}
                    disabled={isDisabled}
                    tabIndex={date === focused ? 0 : -1}
                    className={clsx(
                      round.control,
                      styles.cell,
                      isSelected && round.current,
                      date === today && styles.today,
                      !sameMonth(date, month) && styles.outside,
                    )}
                    onClick={() => {
                      if (!unavailable) onPick(date);
                    }}
                  >
                    {formats.day(date)}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
