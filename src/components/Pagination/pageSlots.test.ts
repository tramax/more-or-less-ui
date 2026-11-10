import { describe, it, expect } from 'vitest';
import { getPageSlots, type PageSlot } from './pageSlots';

const slots = (page: number, pageCount: number, siblingCount = 1, boundaryCount = 1): PageSlot[] =>
  getPageSlots({ page, pageCount, siblingCount, boundaryCount });

const G1 = 'start-gap';
const G2 = 'end-gap';

describe('getPageSlots', () => {
  it('lists every page while they fit the row', () => {
    expect(slots(1, 1)).toEqual([1]);
    expect(slots(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(slots(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('gaps the far end near the start, the near end near the end, both in the middle', () => {
    expect(slots(1, 20)).toEqual([1, 2, 3, 4, 5, G2, 20]);
    expect(slots(4, 20)).toEqual([1, 2, 3, 4, 5, G2, 20]);
    expect(slots(10, 20)).toEqual([1, G1, 9, 10, 11, G2, 20]);
    expect(slots(17, 20)).toEqual([1, G1, 16, 17, 18, 19, 20]);
    expect(slots(20, 20)).toEqual([1, G1, 16, 17, 18, 19, 20]);
  });

  it('never hides a single page behind a gap', () => {
    // 8 pages, page 5: a gap at the far end would stand for the 7 alone, so the 7 is shown
    expect(slots(5, 8)).toEqual([1, G1, 4, 5, 6, 7, 8]);
    expect(slots(4, 8)).toEqual([1, 2, 3, 4, 5, G2, 8]);
    // 9 pages, page 5: both gaps stand for two pages
    expect(slots(5, 9)).toEqual([1, G1, 4, 5, 6, G2, 9]);
    expect(slots(4, 9)).toEqual([1, 2, 3, 4, 5, G2, 9]);
  });

  it('is as long at every page once the list outgrows the row', () => {
    for (const [siblingCount, boundaryCount] of [
      [1, 1],
      [2, 1],
      [0, 1],
      [1, 2],
      [1, 0],
    ] as const) {
      const length = 2 * boundaryCount + 2 * siblingCount + 3;
      for (let page = 1; page <= 30; page++) {
        expect(slots(page, 30, siblingCount, boundaryCount)).toHaveLength(length);
      }
    }
  });

  it('has the current page in the row, and each page at most once, in order', () => {
    for (let page = 1; page <= 30; page++) {
      const pages = slots(page, 30, 2, 2).filter((s): s is number => typeof s === 'number');
      expect(pages).toContain(page);
      expect(pages).toEqual([...new Set(pages)].sort((a, b) => a - b));
    }
  });

  it('takes more siblings and boundaries', () => {
    expect(slots(10, 30, 2, 2)).toEqual([1, 2, G1, 8, 9, 10, 11, 12, G2, 29, 30]);
  });

  it('can have no boundary pages', () => {
    expect(slots(10, 20, 1, 0)).toEqual([G1, 9, 10, 11, G2]);
    expect(slots(1, 20, 1, 0)).toEqual([1, 2, 3, 4, G2]);
  });
});
