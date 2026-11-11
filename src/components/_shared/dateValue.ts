/**
 * The values of the date and time family (Calendar, DateField, ...) and the helpers to turn them into
 * and out of what a server or a `Date` holds. See "Date and time values" in DESIGN.md.
 *
 * A value is what the user read off a calendar or a clock: no time zone, never an offset or `Z`. An
 * _instant_ (one exact moment, `'2026-11-11T13:30:00.000Z'`) is a different thing, and only these
 * helpers cross between the two, so the zone question is always asked out loud.
 */

// Only what the development warning reads. Bundlers replace `process.env.NODE_ENV`; where nothing does
// (a plain browser), `process` is absent and the warning is on.
declare const process: { env?: { NODE_ENV?: string } } | undefined;

/** A calendar date: `'1988-03-14'`. Not a moment; send it to a server as it is. */
export type LocalDate = `${number}-${number}-${number}`;
/** A reading of a 24-hour clock, to the minute: `'14:30'`. */
export type LocalTime = `${number}:${number}`;
/** A reading of a wall clock in some zone: `'2026-11-11T14:30'`. Needs `toInstant` for a server. */
export type LocalDateTime = `${LocalDate}T${LocalTime}`;
/** A month of a year: `'2026-11'` (the month a Calendar shows). */
export type LocalMonth = `${number}-${number}`;

/** A date taken apart. `month` is 1 to 12, as in the string (not 0 to 11, as in `Date`). */
export type DateParts = { year: number; month: number; day: number };
export type DateTimeParts = DateParts & { hour: number; minute: number };

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{2}):(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;
// A zone designator after the time: `Z`, `+01:00`, `-0500`, `+01`
const ZONE = /T.*(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

const isLeapYear = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** The parts of a `LocalDate`, or `null` if it is not one (wrong shape, or a day that doesn't exist). */
export function parseLocalDate(value: unknown): DateParts | null {
  if (typeof value !== 'string') return null;
  const match = DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function parseLocalTime(value: unknown): { hour: number; minute: number } | null {
  if (typeof value !== 'string') return null;
  const match = TIME.exec(value);
  if (!match) return null;
  const [hour, minute] = [Number(match[1]), Number(match[2])];
  return hour > 23 || minute > 59 ? null : { hour, minute };
}

export function parseLocalDateTime(value: unknown): DateTimeParts | null {
  if (typeof value !== 'string') return null;
  const [date, time, ...extra] = value.split('T');
  if (extra.length > 0) return null;
  const parsedDate = parseLocalDate(date);
  const parsedTime = parseLocalTime(time);
  return parsedDate && parsedTime ? { ...parsedDate, ...parsedTime } : null;
}

export function parseLocalMonth(value: unknown): { year: number; month: number } | null {
  if (typeof value !== 'string') return null;
  const match = MONTH.exec(value);
  if (!match) return null;
  const [year, month] = [Number(match[1]), Number(match[2])];
  return year < 1 || month < 1 || month > 12 ? null : { year, month };
}

const pad = (n: number, length = 2) => String(n).padStart(length, '0');

export const formatLocalDate = ({ year, month, day }: DateParts) =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}` as LocalDate;
export const formatLocalTime = ({ hour, minute }: { hour: number; minute: number }) =>
  `${pad(hour)}:${pad(minute)}` as LocalTime;
export const formatLocalDateTime = (parts: DateTimeParts) =>
  `${formatLocalDate(parts)}T${formatLocalTime(parts)}` as LocalDateTime;
export const formatLocalMonth = ({ year, month }: { year: number; month: number }) =>
  `${pad(year, 4)}-${pad(month)}` as LocalMonth;

export const isLocalDate = (value: unknown): value is LocalDate => parseLocalDate(value) !== null;
export const isLocalTime = (value: unknown): value is LocalTime => parseLocalTime(value) !== null;
export const isLocalDateTime = (value: unknown): value is LocalDateTime =>
  parseLocalDateTime(value) !== null;

/** True for a string that ends in a zone (`Z`, `+01:00`): an instant, which a local value never is. */
export const hasZone = (value: string) => ZONE.test(value);

/**
 * In development, says that a date value is not one, and why. A string that carries a zone is the
 * common mistake (`value={booking.startsAt}` straight from a server); the message names the fix. The
 * component shows the field empty either way: it never guesses a conversion.
 */
export function warnIfNotLocal(component: string, prop: string, value: unknown, isValid: boolean) {
  if (value === undefined || value === null || value === '' || isValid) return;
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return;
  const hint =
    typeof value === 'string' && hasZone(value)
      ? ' It carries a time zone, so it is an instant, not a local value: convert it with fromInstant(value, timeZone).'
      : ' Expected the form YYYY-MM-DD (a date), HH:mm (a time) or YYYY-MM-DDTHH:mm (both), for a day that exists.';
  console.error(
    `${component}: \`${prop}\` ${JSON.stringify(value)} is not a valid local value.${hint}`,
  );
}

// --- Date <-> local value (the browser's zone) ---------------------------------------------------------

/** A `Date` from parts, in the browser's zone. `new Date(y, ...)` maps years 0 to 99 to 1900s; this doesn't. */
function localDate(parts: DateTimeParts): Date {
  const date = new Date(2000, 0, 1, parts.hour, parts.minute);
  date.setFullYear(parts.year, parts.month - 1, parts.day);
  return date;
}

/**
 * A `Date` for a `LocalDate` (midnight) or a `LocalDateTime`, in the browser's zone, built from the parts.
 * Not `new Date('1988-03-14')`, which reads a date-only string as UTC and so lands on the 13th west of
 * Greenwich. Throws a `RangeError` for anything that is not a valid value.
 */
export function toDate(value: LocalDate | LocalDateTime): Date {
  const parts = parseLocalDateTime(value) ?? withMidnight(parseLocalDate(value));
  if (!parts)
    throw new RangeError(`toDate: ${JSON.stringify(value)} is not a local date or date-time`);
  return localDate(parts);
}

const withMidnight = (date: DateParts | null): DateTimeParts | null =>
  date && { ...date, hour: 0, minute: 0 };

/**
 * A local value from a `Date`, read in the browser's zone: the date, by default. Not
 * `date.toISOString().slice(0, 10)`, which is the UTC date and a day off for some hours of each day.
 */
export function fromDate(date: Date): LocalDate;
export function fromDate(date: Date, kind: 'date'): LocalDate;
export function fromDate(date: Date, kind: 'time'): LocalTime;
export function fromDate(date: Date, kind: 'dateTime'): LocalDateTime;
export function fromDate(date: Date, kind: 'date' | 'time' | 'dateTime' = 'date') {
  if (Number.isNaN(date.getTime())) throw new RangeError('fromDate: the date is invalid');
  const parts = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
  if (kind === 'time') return formatLocalTime(parts);
  return kind === 'dateTime' ? formatLocalDateTime(parts) : formatLocalDate(parts);
}

// --- Local value <-> instant (any zone) ------------------------------------------------------------------

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatterFor(timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    // Throws a RangeError for a zone that doesn't exist, which is what the caller should hear
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The wall clock in `timeZone` at an instant, as parts (seconds too, for the offset). */
function wallClock(ms: number, timeZone: string) {
  const parts: Record<string, number> = {};
  for (const { type, value } of formatterFor(timeZone).formatToParts(ms)) {
    if (type !== 'literal') parts[type] = Number(value);
  }
  return {
    year: parts.year ?? 0,
    month: parts.month ?? 0,
    day: parts.day ?? 0,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

/** Milliseconds for a wall clock read as if it were UTC (the year-0-to-99 trap of `Date.UTC` avoided). */
function wallAsUtc(p: ReturnType<typeof wallClock>): number {
  const date = new Date(0);
  date.setUTCFullYear(p.year, p.month - 1, p.day);
  date.setUTCHours(p.hour, p.minute, p.second, 0);
  return date.getTime();
}

/** How far ahead of UTC the zone's clock is at an instant, in milliseconds. */
function offsetAt(ms: number, timeZone: string): number {
  const whole = Math.floor(ms / 1000) * 1000;
  return wallAsUtc(wallClock(whole, timeZone)) - whole;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * The instant (UTC ISO string, ending in `Z`) at which the clock in `timeZone` reads `value`. The zone is
 * the browser's unless given: pass the place's zone (`'Europe/Paris'`) when the value is a wall clock
 * somewhere else, such as the table's restaurant. A time that does not exist (the clocks went forward)
 * moves forward over the gap, and one that happens twice (they went back) is the earlier of the two,
 * as `Date` and Temporal's "compatible" mode do.
 */
export function toInstant(value: LocalDateTime, timeZone: string = browserZone()): string {
  const parts = parseLocalDateTime(value);
  if (!parts) throw new RangeError(`toInstant: ${JSON.stringify(value)} is not a local date-time`);

  const guess = wallAsUtc({ ...parts, second: 0 });
  // The offsets just before and after: a transition inside this window is the only way they differ
  const before = offsetAt(guess - DAY, timeZone);
  const after = offsetAt(guess + DAY, timeZone);
  const candidates = [...new Set([before, after])]
    .map((offset) => ({ offset, ms: guess - offset }))
    .filter(({ offset, ms }) => offsetAt(ms, timeZone) === offset)
    .map(({ ms }) => ms);

  // No candidate: the time falls in a gap. The offset from before it moves the time forward over it.
  const ms = candidates.length > 0 ? Math.min(...candidates) : guess - before;
  return new Date(ms).toISOString();
}

/**
 * The local value for an instant, as the clock in `timeZone` (the browser's unless given) reads at that
 * moment. The instant must say its zone (`Z` or an offset): a string without one would be read as local
 * time, which is the mistake this exists to prevent, so it throws a `RangeError`.
 */
export function fromInstant(
  instant: string | Date,
  timeZone: string = browserZone(),
): LocalDateTime {
  if (typeof instant === 'string' && !hasZone(instant)) {
    throw new RangeError(
      `fromInstant: ${JSON.stringify(instant)} has no time zone (Z or an offset), so it is not an instant`,
    );
  }
  const ms = new Date(instant).getTime();
  if (Number.isNaN(ms))
    throw new RangeError(`fromInstant: ${JSON.stringify(instant)} is not a date`);
  return formatLocalDateTime(wallClock(ms, timeZone));
}

/** Today's date in `timeZone` (the browser's unless given): for `min` / `max` and a Today preset. */
export function today(timeZone: string = browserZone()): LocalDate {
  return formatLocalDate(wallClock(Date.now(), timeZone));
}
