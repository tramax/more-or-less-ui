import { toDate, type LocalDate, type LocalMonth } from '../_shared/dateValue';
import { addDays, type Weekday } from './calendarMath';
import type { DayFormats } from './DayGrid';

// A Sunday, to name the weekdays from
const SUNDAY: LocalDate = '2023-01-01';

/** A formatter for `locale`; a locale the browser doesn't know falls back to its own rather than throwing. */
function formatter(locale: string | undefined, options: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat(locale, options);
  } catch {
    return new Intl.DateTimeFormat(undefined, options);
  }
}

/**
 * Every piece of text the calendar writes from a date, in the locale. All of it reads the date in the
 * browser's zone through `toDate`, which builds from the parts, so no date is a day off.
 */
export function makeFormats(locale: string | undefined) {
  const day = formatter(locale, { day: 'numeric' });
  const full = formatter(locale, { dateStyle: 'full' });
  const monthYear = formatter(locale, { month: 'long', year: 'numeric' });
  const monthShort = formatter(locale, { month: 'short' });
  const year = formatter(locale, { year: 'numeric' });
  const weekdayShort = formatter(locale, { weekday: 'short' });
  const weekdayLong = formatter(locale, { weekday: 'long' });

  const days: DayFormats = {
    day: (date) => day.format(toDate(date)),
    full: (date) => full.format(toDate(date)),
    weekday: (weekday) => {
      const date = toDate(addDays(SUNDAY, weekday));
      return { short: weekdayShort.format(date), long: weekdayLong.format(date) };
    },
  };

  return {
    days,
    /** "November 2026": the header over the days, and the name of a month cell. */
    monthYear: (date: LocalDate) => monthYear.format(toDate(date)),
    /** "Nov": what a month cell shows. */
    monthShort: (date: LocalDate) => monthShort.format(toDate(date)),
    /** "2026". */
    year: (date: LocalDate) => year.format(toDate(date)),
  };
}

/** The first day of the week in a locale (0 is Sunday). Where the browser can't say, Monday, as ISO 8601. */
export function defaultFirstDay(locale: string | undefined): Weekday {
  try {
    const resolved = new Intl.Locale(locale ?? new Intl.DateTimeFormat().resolvedOptions().locale);
    // `getWeekInfo()` is the standard; Chrome and Safari had `weekInfo` first. Monday is 1, Sunday is 7.
    const info = resolved as unknown as {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const firstDay = (info.getWeekInfo?.() ?? info.weekInfo)?.firstDay;
    if (firstDay !== undefined) return (firstDay % 7) as Weekday;
  } catch {
    // an unknown locale: the fallback below
  }
  return 1;
}

export const monthOf = (date: LocalDate): LocalMonth => date.slice(0, 7) as LocalMonth;
