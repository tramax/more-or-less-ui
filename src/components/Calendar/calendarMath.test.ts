import { describe, it, expect } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  endOfMonth,
  endOfWeek,
  getMonthGrid,
  sameMonth,
  startOfMonth,
  startOfWeek,
  weekdayOf,
  yearPageStart,
} from './calendarMath';

describe('addDays', () => {
  it('crosses months, years and leap days', () => {
    expect(addDays('2026-11-11', 1)).toBe('2026-11-12');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-11-11', -365)).toBe('2025-11-11');
    expect(addDays('2026-11-11', 0)).toBe('2026-11-11');
  });

  it('is not moved by daylight saving: the clocks changing is not a day lost', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
  });

  it('throws on a date that is not one', () => {
    expect(() => addDays('2026-02-30' as never, 1)).toThrow(RangeError);
  });
});

describe('addMonths / addYears', () => {
  it('keeps the day, or the last day of a shorter month', () => {
    expect(addMonths('2026-11-11', 1)).toBe('2026-12-11');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
    expect(addMonths('2026-01-15', -13)).toBe('2024-12-15');
  });

  it('moves a year, and a leap day lands on the 28th', () => {
    expect(addYears('2026-11-11', 1)).toBe('2027-11-11');
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
    expect(addYears('2024-02-29', 4)).toBe('2028-02-29');
    expect(addYears('2026-11-11', -38)).toBe('1988-11-11');
  });
});

describe('weeks', () => {
  it('knows the weekday (0 is Sunday)', () => {
    expect(weekdayOf('2026-11-11')).toBe(3); // Wednesday
    expect(weekdayOf('1970-01-01')).toBe(4); // Thursday
    expect(weekdayOf('1969-12-31')).toBe(3);
    expect(weekdayOf('2000-02-29')).toBe(2); // Tuesday
    expect(weekdayOf('2026-11-15')).toBe(0); // Sunday
  });

  it('finds the start and the end of the week for either first day', () => {
    expect(startOfWeek('2026-11-11', 1)).toBe('2026-11-09'); // Monday
    expect(startOfWeek('2026-11-11', 0)).toBe('2026-11-08'); // Sunday
    expect(startOfWeek('2026-11-09', 1)).toBe('2026-11-09');
    expect(startOfWeek('2026-11-15', 1)).toBe('2026-11-09');
    expect(endOfWeek('2026-11-11', 1)).toBe('2026-11-15');
    expect(endOfWeek('2026-11-11', 0)).toBe('2026-11-14');
    expect(startOfWeek('2026-11-11', 6)).toBe('2026-11-07'); // Saturday
  });
});

describe('months', () => {
  it('finds the first and last day', () => {
    expect(startOfMonth('2026-11-11')).toBe('2026-11-01');
    expect(endOfMonth('2026-11-11')).toBe('2026-11-30');
    expect(endOfMonth('2024-02-10')).toBe('2024-02-29');
    expect(endOfMonth('2026-02-10')).toBe('2026-02-28');
  });

  it('compares months', () => {
    expect(sameMonth('2026-11-01', '2026-11-30')).toBe(true);
    expect(sameMonth('2026-11-30', '2026-12-01')).toBe(false);
    expect(sameMonth('2025-11-30', '2026-11-30')).toBe(false);
  });
});

describe('getMonthGrid', () => {
  it('is six weeks of seven, starting on the first day of the week', () => {
    const grid = getMonthGrid('2026-11-11', 1);
    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    // 1 November 2026 is a Sunday: a Monday-first grid starts on 26 October
    expect(grid[0]?.[0]).toBe('2026-10-26');
    expect(grid[0]?.[6]).toBe('2026-11-01');
    expect(grid[5]?.[6]).toBe('2026-12-06');
  });

  it('starts on the 1st when the month begins on the first day of the week', () => {
    const grid = getMonthGrid('2026-11-11', 0);
    expect(grid[0]?.[0]).toBe('2026-11-01');
    expect(grid[5]?.[6]).toBe('2026-12-12');
  });

  it('has every day of the month once, in order, with no gaps', () => {
    const days = getMonthGrid('2024-02-10', 1).flat();
    expect(days.filter((d) => d.startsWith('2024-02'))).toHaveLength(29);
    expect(days.every((d, i) => i === 0 || d === addDays(days[i - 1] as never, 1))).toBe(true);
  });
});

describe('clampDate', () => {
  it('brings a date into the range, and leaves one inside alone', () => {
    expect(clampDate('2026-11-11', '2026-11-15', '2026-11-20')).toBe('2026-11-15');
    expect(clampDate('2026-11-30', '2026-11-15', '2026-11-20')).toBe('2026-11-20');
    expect(clampDate('2026-11-17', '2026-11-15', '2026-11-20')).toBe('2026-11-17');
    expect(clampDate('2026-11-11')).toBe('2026-11-11');
    expect(clampDate('2026-11-11', undefined, '2026-11-01')).toBe('2026-11-01');
  });
});

describe('yearPageStart', () => {
  it('is the first year of the block of twelve that has the year in it', () => {
    expect(yearPageStart(2026)).toBe(2017);
    expect(yearPageStart(2017)).toBe(2017);
    expect(yearPageStart(2028)).toBe(2017);
    expect(yearPageStart(2029)).toBe(2029);
    expect(yearPageStart(1988)).toBe(1981);
    expect(yearPageStart(1)).toBe(1);
  });
});
