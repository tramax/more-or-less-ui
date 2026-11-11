import {
  daysInMonth,
  formatLocalDate,
  parseLocalDate,
  type DateParts,
  type LocalDate,
} from '../_shared/dateValue';

/** The three typed parts of a date. */
export type SegmentKind = 'day' | 'month' | 'year';

/** What each segment holds, as the text in its box: `''` is empty, `'3'` is a day not yet finished. */
export type Segments = Record<SegmentKind, string>;

export const EMPTY_SEGMENTS: Segments = { day: '', month: '', year: '' };

/** How many digits a finished segment has, and the largest number it can be. */
export const SEGMENT_LIMITS = {
  day: { length: 2, max: 31 },
  month: { length: 2, max: 12 },
  year: { length: 4, max: 9999 },
} as const;

/** The order the locale writes a date in, and the text between the parts (`/`, `.`, `-`). */
export type SegmentLayout = { order: SegmentKind[]; literals: [string, string] };

const FALLBACK: SegmentLayout = { order: ['day', 'month', 'year'], literals: ['/', '/'] };
// Direction marks that Intl puts around the separators of some locales
const MARKS = /[‎‏؜]/g;

/**
 * The order and separators of a numeric date in `locale`, from `Intl` (so the US types month, day, year;
 * Germany day, month, year; Japan year, month, day). A locale the browser doesn't know, or one that
 * doesn't give three parts, gets day / month / year.
 */
export function segmentLayout(locale: string | undefined): SegmentLayout {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(2000, 10, 22));
  } catch {
    return FALLBACK;
  }
  const order: SegmentKind[] = [];
  const literals: string[] = [];
  for (const part of parts) {
    if (part.type === 'day' || part.type === 'month' || part.type === 'year') {
      order.push(part.type);
      literals.push('');
    } else if (part.type === 'literal' && order.length > 0) {
      // Text after the last part is dropped below, with the one slot it would fill
      literals[order.length - 1] = part.value.replace(MARKS, '');
    }
  }
  if (order.length !== 3 || new Set(order).size !== 3) return FALLBACK;
  return { order, literals: [literals[0] ?? '/', literals[1] ?? '/'] };
}

const pad = (kind: SegmentKind, text: string) => text.padStart(SEGMENT_LIMITS[kind].length, '0');

/** A date as the three boxes' text, finished (`'03'`, `'02'`, `'1988'`); none as empty boxes. */
export function segmentsFrom(date: LocalDate | null): Segments {
  const parts = date ? parseLocalDate(date) : null;
  if (!parts) return EMPTY_SEGMENTS;
  return {
    day: pad('day', String(parts.day)),
    month: pad('month', String(parts.month)),
    year: pad('year', String(parts.year)),
  };
}

/** The date the boxes spell, or `null` when one is empty or unfinished (a year of two digits) or the day doesn't exist. */
export function compose(segments: Segments): LocalDate | null {
  if (!/^\d{4}$/.test(segments.year) || !/^\d{1,2}$/.test(segments.month)) return null;
  if (!/^\d{1,2}$/.test(segments.day)) return null;
  const parts: DateParts = {
    year: Number(segments.year),
    month: Number(segments.month),
    day: Number(segments.day),
  };
  const date = formatLocalDate(parts);
  // `parseLocalDate` is where "February 30th" and "year 0" are refused
  return parseLocalDate(date) ? date : null;
}

/** Every box is filled in but they don't spell a date (31 February): the one case that is wrong, and not just unfinished. */
export const isImpossible = (segments: Segments) =>
  segments.year.length === 4 &&
  segments.month !== '' &&
  segments.day !== '' &&
  compose(segments) === null;

/**
 * What a digit does to a segment. `current` is what the box holds, or `''` when the digit starts it
 * afresh (the box was just entered). `done` is when nothing more can follow, so focus moves on: a
 * day typed `4` can't be `4x`, so it is `04` at once; a day typed `3` waits for the next digit.
 */
export function typeDigit(
  kind: SegmentKind,
  current: string,
  digit: string,
): { text: string; done: boolean } {
  if (kind === 'year') {
    const text = (current.length >= 4 ? '' : current) + digit;
    return { text, done: text.length === 4 };
  }
  const { max } = SEGMENT_LIMITS[kind];
  if (current.length === 1) {
    const both = Number(current + digit);
    // `00` is nothing: wait for a real digit
    if (both === 0) return { text: current, done: false };
    if (both <= max) return { text: current + digit, done: true };
    // `35` is no day: the new digit starts over
  }
  return Number(digit) * 10 > max
    ? { text: `0${digit}`, done: true }
    : { text: digit, done: false };
}

/** A box with one digit in it, finished (`3` is `03`); the others are left as they are. */
export const finish = (kind: SegmentKind, text: string) =>
  kind !== 'year' && text.length === 1 && text !== '0' ? pad(kind, text) : text;

/**
 * An arrow key on a box: one more or one less, wrapping a day and a month (31 → 1, 12 → 1) and stopping
 * a year at its ends. An empty box takes today's value, as the native date input does, whichever the key.
 * A day can't pass the end of the month once the month and year are known.
 */
export function step(
  kind: SegmentKind,
  segments: Segments,
  direction: 1 | -1,
  today: DateParts,
): string {
  const month = Number(segments.month);
  const knowsMonth = segments.year.length === 4 && month >= 1 && month <= 12;
  const high =
    kind === 'day'
      ? knowsMonth
        ? daysInMonth(Number(segments.year), month)
        : 31
      : SEGMENT_LIMITS[kind].max;
  const current = Number(segments[kind]);
  const next = current
    ? kind === 'year'
      ? Math.min(high, Math.max(1, current + direction))
      : ((current - 1 + direction + high) % high) + 1
    : Math.min(high, today[kind]);
  return pad(kind, String(next));
}

/**
 * Three numbers in a pasted text, as a date: `1988-03-14` (a year first is ISO), or in the locale's
 * order (`14/03/1988` for a locale that writes day first). Anything else is not a date.
 */
export function parsePaste(text: string, order: SegmentKind[]): Segments | null {
  const numbers = text.match(/\d+/g);
  if (!numbers || numbers.length !== 3) return null;
  const kinds: SegmentKind[] = numbers[0]!.length === 4 ? ['year', 'month', 'day'] : order;
  const segments = { ...EMPTY_SEGMENTS };
  for (const [index, kind] of kinds.entries()) {
    const digits = numbers[index]!;
    if (digits.length > SEGMENT_LIMITS[kind].length) return null;
    segments[kind] = digits;
  }
  // A year of 2 digits is not ours to guess the century of
  if (segments.year.length !== 4) return null;
  return {
    day: finish('day', segments.day),
    month: finish('month', segments.month),
    year: segments.year,
  };
}
