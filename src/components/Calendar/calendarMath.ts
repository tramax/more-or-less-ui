import {
  daysInMonth,
  formatLocalDate,
  parseLocalDate,
  type DateParts,
  type LocalDate,
} from '../_shared/dateValue';

/** 0 is Sunday, as `Date.getDay()` and `Intl.Locale`'s `firstDay` (which counts Monday as 1, Sunday as 7) after `% 7`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_MS = 24 * 60 * 60 * 1000;

// Dates here are counted in whole days from a fixed point, on UTC dates, so no daylight saving shift
// can make a day 23 or 25 hours long
function toDayNumber({ year, month, day }: DateParts): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return Math.round(date.getTime() / DAY_MS);
}

function fromDayNumber(days: number): DateParts {
  const date = new Date(days * DAY_MS);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

// Callers hand in values they have already checked, so a bad one is a bug here, not input
const parts = (date: LocalDate): DateParts => {
  const parsed = parseLocalDate(date);
  if (!parsed) throw new RangeError(`${JSON.stringify(date)} is not a local date`);
  return parsed;
};

export const addDays = (date: LocalDate, days: number): LocalDate =>
  formatLocalDate(fromDayNumber(toDayNumber(parts(date)) + days));

/** Whole months later, keeping the day of the month unless the month is shorter (31 March + 1 month: 30 April). */
export function addMonths(date: LocalDate, months: number): LocalDate {
  const { year, month, day } = parts(date);
  const index = year * 12 + (month - 1) + months;
  const [nextYear, nextMonth] = [Math.floor(index / 12), (index % 12) + 1];
  return formatLocalDate({
    year: nextYear,
    month: nextMonth,
    day: Math.min(day, daysInMonth(nextYear, nextMonth)),
  });
}

/** 29 February + 1 year is 28 February. */
export const addYears = (date: LocalDate, years: number): LocalDate => addMonths(date, years * 12);

export const weekdayOf = (date: LocalDate): Weekday =>
  // 1 January 1970 was a Thursday (4)
  ((((toDayNumber(parts(date)) + 4) % 7) + 7) % 7) as Weekday;

/** The first day of the week that contains `date`, for a week that starts on `firstDay`. */
export const startOfWeek = (date: LocalDate, firstDay: Weekday): LocalDate =>
  addDays(date, -((weekdayOf(date) - firstDay + 7) % 7));

export const endOfWeek = (date: LocalDate, firstDay: Weekday): LocalDate =>
  addDays(startOfWeek(date, firstDay), 6);

export const startOfMonth = (date: LocalDate): LocalDate =>
  formatLocalDate({ ...parts(date), day: 1 });

export const endOfMonth = (date: LocalDate): LocalDate => {
  const { year, month } = parts(date);
  return formatLocalDate({ year, month, day: daysInMonth(year, month) });
};

/** Same-shaped valid dates sort as strings. */
export const isBefore = (a: LocalDate, b: LocalDate) => a < b;

/** `date` brought into `min`..`max` (either may be absent). */
export function clampDate(date: LocalDate, min?: LocalDate, max?: LocalDate): LocalDate {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

/** Whether a date can't be chosen: outside `min`..`max` (either may be absent), or one `isDisabled` refuses. */
export const isUnavailable = (
  date: LocalDate,
  limits: { min?: LocalDate | undefined; max?: LocalDate | undefined },
  isDisabled?: (date: LocalDate) => boolean,
) =>
  (limits.min !== undefined && date < limits.min) ||
  (limits.max !== undefined && date > limits.max) ||
  (isDisabled?.(date) ?? false);

export const sameMonth = (a: LocalDate, b: LocalDate) => a.slice(0, 7) === b.slice(0, 7);

/**
 * The six weeks a month is drawn over, always six so the calendar is one height: the days of the
 * month, with the days of the months either side filling the first and last rows.
 */
export function getMonthGrid(date: LocalDate, firstDay: Weekday): LocalDate[][] {
  const start = startOfWeek(startOfMonth(date), firstDay);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
}

/** The twelve years a page of the year grid shows: the 12-year block that contains `year`. */
export const yearPageStart = (year: number) => Math.floor((year - 1) / 12) * 12 + 1;
