import { describe, it, expect } from 'vitest';
import {
  EMPTY_SEGMENTS,
  compose,
  finish,
  isImpossible,
  parsePaste,
  segmentLayout,
  segmentsFrom,
  step,
  typeDigit,
} from './segments';

const NOV_11 = { year: 2026, month: 11, day: 11 };

describe('segmentLayout', () => {
  it('follows the locale: month first in the US, year first in Japan, day first in Germany', () => {
    expect(segmentLayout('en-US')).toEqual({
      order: ['month', 'day', 'year'],
      literals: ['/', '/'],
    });
    expect(segmentLayout('ja-JP').order).toEqual(['year', 'month', 'day']);
    expect(segmentLayout('de-DE')).toEqual({
      order: ['day', 'month', 'year'],
      literals: ['.', '.'],
    });
  });

  it('keeps the space of a separator that has one, and drops direction marks', () => {
    const { literals } = segmentLayout('ko-KR');
    expect(literals[0]).toBe('. ');
    expect(literals.join('')).not.toMatch(/[‎‏]/);
  });

  it('gives three parts for a locale it does not know', () => {
    expect(segmentLayout('not a locale').order).toHaveLength(3);
  });
});

describe('segmentsFrom and compose', () => {
  it('writes a date as finished boxes, and reads it back', () => {
    expect(segmentsFrom('1988-03-04')).toEqual({ day: '04', month: '03', year: '1988' });
    expect(compose(segmentsFrom('1988-03-04'))).toBe('1988-03-04');
    expect(segmentsFrom(null)).toEqual(EMPTY_SEGMENTS);
  });

  it('reads a date only when all three are there, with a year of four digits', () => {
    expect(compose({ day: '4', month: '3', year: '1988' })).toBe('1988-03-04');
    expect(compose({ day: '', month: '03', year: '1988' })).toBeNull();
    expect(compose({ day: '04', month: '03', year: '88' })).toBeNull();
  });

  it('refuses a day that does not exist, and a year 0', () => {
    expect(compose({ day: '30', month: '02', year: '2024' })).toBeNull();
    expect(compose({ day: '29', month: '02', year: '2024' })).toBe('2024-02-29');
    expect(compose({ day: '01', month: '01', year: '0000' })).toBeNull();
  });

  it('says "impossible" only for boxes that are all filled and spell nothing', () => {
    expect(isImpossible({ day: '31', month: '02', year: '2024' })).toBe(true);
    expect(isImpossible({ day: '31', month: '02', year: '' })).toBe(false);
    expect(isImpossible({ day: '04', month: '03', year: '1988' })).toBe(false);
  });
});

describe('typeDigit', () => {
  it('finishes a day or month that no second digit could follow', () => {
    expect(typeDigit('day', '', '4')).toEqual({ text: '04', done: true });
    expect(typeDigit('month', '', '2')).toEqual({ text: '02', done: true });
  });

  it('waits after a first digit that could be followed', () => {
    expect(typeDigit('day', '', '3')).toEqual({ text: '3', done: false });
    expect(typeDigit('month', '', '1')).toEqual({ text: '1', done: false });
    expect(typeDigit('day', '', '0')).toEqual({ text: '0', done: false });
  });

  it('finishes on the second digit', () => {
    expect(typeDigit('day', '3', '1')).toEqual({ text: '31', done: true });
    expect(typeDigit('month', '0', '9')).toEqual({ text: '09', done: true });
  });

  it('starts over when two digits would be too big, and ignores 00', () => {
    expect(typeDigit('day', '3', '5')).toEqual({ text: '05', done: true });
    expect(typeDigit('month', '1', '3')).toEqual({ text: '03', done: true });
    expect(typeDigit('day', '0', '0')).toEqual({ text: '0', done: false });
  });

  it('takes four digits for a year, then starts again', () => {
    expect(typeDigit('year', '19', '8')).toEqual({ text: '198', done: false });
    expect(typeDigit('year', '198', '8')).toEqual({ text: '1988', done: true });
    expect(typeDigit('year', '1988', '2')).toEqual({ text: '2', done: false });
  });
});

describe('finish', () => {
  it('pads one digit of a day or month, and nothing else', () => {
    expect(finish('day', '3')).toBe('03');
    expect(finish('month', '9')).toBe('09');
    expect(finish('day', '0')).toBe('0');
    expect(finish('year', '9')).toBe('9');
    expect(finish('day', '')).toBe('');
  });
});

describe('step', () => {
  it('takes today for an empty box, whichever way', () => {
    expect(step('day', EMPTY_SEGMENTS, 1, NOV_11)).toBe('11');
    expect(step('month', EMPTY_SEGMENTS, -1, NOV_11)).toBe('11');
    expect(step('year', EMPTY_SEGMENTS, 1, NOV_11)).toBe('2026');
  });

  it('wraps a day and a month', () => {
    const december = { day: '31', month: '12', year: '2026' };
    expect(step('day', december, 1, NOV_11)).toBe('01');
    expect(step('day', { ...december, day: '01' }, -1, NOV_11)).toBe('31');
    expect(step('month', december, 1, NOV_11)).toBe('01');
    expect(step('month', { ...december, month: '01' }, -1, NOV_11)).toBe('12');
  });

  it('wraps a day at the end of the month it is in', () => {
    expect(step('day', { day: '28', month: '02', year: '2026' }, 1, NOV_11)).toBe('01');
    expect(step('day', { day: '28', month: '02', year: '2024' }, 1, NOV_11)).toBe('29');
    // With no year, February could be either, so it allows the longest month
    expect(step('day', { day: '30', month: '02', year: '' }, 1, NOV_11)).toBe('31');
  });

  it('stops a year at its ends', () => {
    expect(step('year', { day: '', month: '', year: '9999' }, 1, NOV_11)).toBe('9999');
    expect(step('year', { day: '', month: '', year: '0001' }, -1, NOV_11)).toBe('0001');
    expect(step('year', { day: '', month: '', year: '1988' }, 1, NOV_11)).toBe('1989');
  });
});

describe('parsePaste', () => {
  it('reads an ISO date', () => {
    expect(parsePaste('1988-03-14', ['month', 'day', 'year'])).toEqual({
      day: '14',
      month: '03',
      year: '1988',
    });
  });

  it('reads the locale order when the year is last', () => {
    expect(parsePaste('3/14/1988', ['month', 'day', 'year'])).toEqual({
      day: '14',
      month: '03',
      year: '1988',
    });
    expect(parsePaste('14.03.1988', ['day', 'month', 'year'])).toEqual({
      day: '14',
      month: '03',
      year: '1988',
    });
  });

  it('refuses what is not three numbers, a two-digit year, or a part too long', () => {
    expect(parsePaste('hello', ['day', 'month', 'year'])).toBeNull();
    expect(parsePaste('14/03', ['day', 'month', 'year'])).toBeNull();
    expect(parsePaste('14/03/88', ['day', 'month', 'year'])).toBeNull();
    expect(parsePaste('140/03/1988', ['day', 'month', 'year'])).toBeNull();
  });
});
