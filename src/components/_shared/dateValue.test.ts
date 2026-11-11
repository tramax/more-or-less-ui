import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  daysInMonth,
  formatLocalDate,
  formatLocalDateTime,
  formatLocalMonth,
  formatLocalTime,
  fromDate,
  fromInstant,
  hasZone,
  isLocalDate,
  isLocalDateTime,
  isLocalTime,
  parseLocalDate,
  parseLocalDateTime,
  parseLocalMonth,
  parseLocalTime,
  today,
  toDate,
  toInstant,
  warnIfNotLocal,
  type LocalDate,
  type LocalDateTime,
} from './dateValue';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('daysInMonth', () => {
  it('knows the lengths of the months and of leap Februaries', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
  });
});

describe('parsing', () => {
  it('reads a date and refuses a day that does not exist', () => {
    expect(parseLocalDate('1988-03-14')).toEqual({ year: 1988, month: 3, day: 14 });
    expect(parseLocalDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseLocalDate('2023-02-29')).toBeNull();
    expect(parseLocalDate('2026-04-31')).toBeNull();
    expect(parseLocalDate('2026-13-01')).toBeNull();
    expect(parseLocalDate('2026-00-10')).toBeNull();
    expect(parseLocalDate('0000-01-01')).toBeNull();
  });

  it('refuses the wrong shape, other types and strings with a zone or a time', () => {
    expect(parseLocalDate('1988-3-14')).toBeNull();
    expect(parseLocalDate('14/03/1988')).toBeNull();
    expect(parseLocalDate('1988-03-14T00:00')).toBeNull();
    expect(parseLocalDate(new Date())).toBeNull();
    expect(parseLocalDate(null)).toBeNull();
    expect(parseLocalDate(undefined)).toBeNull();
  });

  it('reads a time on a 24-hour clock', () => {
    expect(parseLocalTime('00:00')).toEqual({ hour: 0, minute: 0 });
    expect(parseLocalTime('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(parseLocalTime('24:00')).toBeNull();
    expect(parseLocalTime('12:60')).toBeNull();
    expect(parseLocalTime('9:30')).toBeNull();
    expect(parseLocalTime('14:30:00')).toBeNull();
  });

  it('reads a date-time, and refuses an instant', () => {
    expect(parseLocalDateTime('2026-11-11T14:30')).toEqual({
      year: 2026,
      month: 11,
      day: 11,
      hour: 14,
      minute: 30,
    });
    expect(parseLocalDateTime('2026-11-11T14:30Z')).toBeNull();
    expect(parseLocalDateTime('2026-11-11T14:30:00.000Z')).toBeNull();
    expect(parseLocalDateTime('2026-11-11T14:30+01:00')).toBeNull();
    expect(parseLocalDateTime('2026-11-11 14:30')).toBeNull();
    expect(parseLocalDateTime('2026-11-11')).toBeNull();
    expect(parseLocalDateTime('2026-11-11T14:30T10:00')).toBeNull();
  });

  it('reads a month', () => {
    expect(parseLocalMonth('2026-11')).toEqual({ year: 2026, month: 11 });
    expect(parseLocalMonth('2026-13')).toBeNull();
    expect(parseLocalMonth('2026-11-01')).toBeNull();
  });

  it('has type guards that agree', () => {
    expect(isLocalDate('1988-03-14')).toBe(true);
    expect(isLocalDate('1988-02-30')).toBe(false);
    expect(isLocalTime('14:30')).toBe(true);
    expect(isLocalTime('14:75')).toBe(false);
    expect(isLocalDateTime('2026-11-11T14:30')).toBe(true);
    expect(isLocalDateTime('2026-11-11T14:30Z')).toBe(false);
  });
});

describe('formatting', () => {
  it('pads, and round-trips with parsing', () => {
    expect(formatLocalDate({ year: 988, month: 3, day: 4 })).toBe('0988-03-04');
    expect(formatLocalTime({ hour: 9, minute: 5 })).toBe('09:05');
    expect(formatLocalDateTime({ year: 2026, month: 1, day: 2, hour: 3, minute: 4 })).toBe(
      '2026-01-02T03:04',
    );
    expect(formatLocalMonth({ year: 2026, month: 3 })).toBe('2026-03');
    expect(formatLocalDate(parseLocalDate('2026-11-11')!)).toBe('2026-11-11');
  });
});

describe('hasZone', () => {
  it('is true for an instant and false for a local value', () => {
    expect(hasZone('2026-11-11T13:30:00.000Z')).toBe(true);
    expect(hasZone('2026-11-11T13:30Z')).toBe(true);
    expect(hasZone('2026-11-11T14:30:00+01:00')).toBe(true);
    expect(hasZone('2026-11-11T14:30-0500')).toBe(true);
    expect(hasZone('2026-11-11T14:30')).toBe(false);
    expect(hasZone('2026-11-11')).toBe(false);
    expect(hasZone('14:30')).toBe(false);
  });
});

describe('warnIfNotLocal', () => {
  it('says nothing for a valid value or an empty one', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnIfNotLocal('Calendar', 'value', '2026-11-11', true);
    warnIfNotLocal('Calendar', 'value', undefined, false);
    warnIfNotLocal('Calendar', 'value', null, false);
    warnIfNotLocal('Calendar', 'value', '', false);
    expect(error).not.toHaveBeenCalled();
  });

  it('names fromInstant when the value carries a zone', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnIfNotLocal('DateTimePicker', 'value', '2026-11-11T13:30:00.000Z', false);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]?.[0])).toContain('fromInstant');
    expect(String(error.mock.calls[0]?.[0])).toContain('DateTimePicker');
  });

  it('describes the expected forms for any other bad value', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnIfNotLocal('Calendar', 'value', '14/03/1988', false);
    expect(String(error.mock.calls[0]?.[0])).toContain('YYYY-MM-DD');
  });
});

describe('toDate / fromDate (the browser zone)', () => {
  it('builds a date from the parts, so the 14th is the 14th in every zone', () => {
    const date = toDate('1988-03-14');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([1988, 2, 14]);
    expect([date.getHours(), date.getMinutes()]).toEqual([0, 0]);
  });

  it('reads the time of a date-time', () => {
    const date = toDate('2026-11-11T14:30');
    expect([date.getDate(), date.getHours(), date.getMinutes()]).toEqual([11, 14, 30]);
  });

  it('keeps a year below 100', () => {
    expect(toDate('0050-06-15').getFullYear()).toBe(50);
  });

  it('throws on a value that is not one', () => {
    expect(() => toDate('1988-02-30' as LocalDate)).toThrow(RangeError);
    expect(() => toDate('2026-11-11T14:30Z' as LocalDateTime)).toThrow(RangeError);
  });

  it('reads a date, a time or both back from a Date, in the browser zone', () => {
    const date = new Date(1988, 2, 14, 23, 59);
    expect(fromDate(date)).toBe('1988-03-14');
    expect(fromDate(date, 'date')).toBe('1988-03-14');
    expect(fromDate(date, 'time')).toBe('23:59');
    expect(fromDate(date, 'dateTime')).toBe('1988-03-14T23:59');
  });

  it('round-trips', () => {
    expect(fromDate(toDate('2024-02-29'))).toBe('2024-02-29');
    expect(fromDate(toDate('2026-11-11T08:05'), 'dateTime')).toBe('2026-11-11T08:05');
  });

  it('throws on an invalid Date', () => {
    expect(() => fromDate(new Date('nope'))).toThrow(RangeError);
  });
});

describe('toInstant', () => {
  it('is the same wall clock in different places, at different moments', () => {
    expect(toInstant('2026-11-11T14:30', 'Europe/Paris')).toBe('2026-11-11T13:30:00.000Z');
    expect(toInstant('2026-11-11T14:30', 'America/New_York')).toBe('2026-11-11T19:30:00.000Z');
    expect(toInstant('2026-11-11T14:30', 'UTC')).toBe('2026-11-11T14:30:00.000Z');
  });

  it('handles half-hour offsets and zones ahead of UTC by more than a day of the date', () => {
    expect(toInstant('2026-11-11T14:30', 'Asia/Kolkata')).toBe('2026-11-11T09:00:00.000Z');
    expect(toInstant('2026-11-11T14:30', 'Pacific/Auckland')).toBe('2026-11-11T01:30:00.000Z');
    expect(toInstant('2026-11-11T00:15', 'Asia/Tokyo')).toBe('2026-11-10T15:15:00.000Z');
  });

  it('uses the offset in force on that date, not today’s', () => {
    expect(toInstant('2026-07-01T12:00', 'Europe/Paris')).toBe('2026-07-01T10:00:00.000Z');
    expect(toInstant('2026-01-01T12:00', 'Europe/Paris')).toBe('2026-01-01T11:00:00.000Z');
  });

  it('moves a time that does not exist forward over the gap', () => {
    // Paris, 29 March 2026: 02:00 became 03:00
    expect(toInstant('2026-03-29T02:30', 'Europe/Paris')).toBe('2026-03-29T01:30:00.000Z');
    // New York, 8 March 2026
    expect(toInstant('2026-03-08T02:30', 'America/New_York')).toBe('2026-03-08T07:30:00.000Z');
  });

  it('takes the earlier of a time that happens twice', () => {
    // Paris, 25 October 2026: 03:00 became 02:00, so 02:30 is 00:30Z (summer) and 01:30Z (winter)
    expect(toInstant('2026-10-25T02:30', 'Europe/Paris')).toBe('2026-10-25T00:30:00.000Z');
    // New York, 1 November 2026
    expect(toInstant('2026-11-01T01:30', 'America/New_York')).toBe('2026-11-01T05:30:00.000Z');
  });

  it('is the browser zone by default, as `new Date(parts)` reads it', () => {
    expect(toInstant('2026-11-11T14:30')).toBe(new Date(2026, 10, 11, 14, 30).toISOString());
    expect(toInstant('2026-07-01T00:00')).toBe(new Date(2026, 6, 1, 0, 0).toISOString());
  });

  it('throws on a value that is not local, and on a zone that does not exist', () => {
    expect(() => toInstant('2026-11-11T14:30Z' as LocalDateTime)).toThrow(RangeError);
    expect(() => toInstant('2026-11-11T14:30', 'Mars/Olympus')).toThrow(RangeError);
  });
});

describe('fromInstant', () => {
  it('reads the clock in a zone at that moment', () => {
    expect(fromInstant('2026-11-11T13:30:00.000Z', 'Europe/Paris')).toBe('2026-11-11T14:30');
    expect(fromInstant('2026-11-11T13:30:00.000Z', 'America/New_York')).toBe('2026-11-11T08:30');
    expect(fromInstant('2026-11-11T13:30Z', 'UTC')).toBe('2026-11-11T13:30');
  });

  it('accepts an offset, and a Date', () => {
    expect(fromInstant('2026-11-11T14:30:00+01:00', 'America/New_York')).toBe('2026-11-11T08:30');
    expect(fromInstant(new Date('2026-11-11T13:30:00Z'), 'Europe/Paris')).toBe('2026-11-11T14:30');
  });

  it('reads midnight as 00:00, not 24:00', () => {
    expect(fromInstant('2026-11-10T23:00:00Z', 'Europe/Paris')).toBe('2026-11-11T00:00');
  });

  it('refuses a string with no zone: it would be read as local time', () => {
    expect(() => fromInstant('2026-11-11T14:30')).toThrow(RangeError);
    expect(() => fromInstant('2026-11-11')).toThrow(RangeError);
  });

  it('refuses something that is not a date', () => {
    expect(() => fromInstant('hello Z')).toThrow(RangeError);
  });

  it('undoes toInstant, which is how to check a time that falls in a gap', () => {
    const zone = 'Europe/Paris';
    const fine: LocalDateTime = '2026-11-11T14:30';
    const gap: LocalDateTime = '2026-03-29T02:30';
    expect(fromInstant(toInstant(fine, zone), zone)).toBe(fine);
    expect(fromInstant(toInstant(gap, zone), zone)).toBe('2026-03-29T03:30');
  });
});

describe('today', () => {
  it('is the date in the zone at this moment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T23:30:00Z'));
    expect(today('UTC')).toBe('2026-11-11');
    expect(today('America/New_York')).toBe('2026-11-11');
    expect(today('Asia/Tokyo')).toBe('2026-11-12');
  });
});
