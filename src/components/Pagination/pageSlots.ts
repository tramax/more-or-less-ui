/** One place in the row: a page number, or a gap standing in for the pages between two ends. */
export type PageSlot = number | 'start-gap' | 'end-gap';

const range = (from: number, to: number) =>
  Array.from({ length: Math.max(to - from + 1, 0) }, (_, index) => from + index);

type Window = {
  /** The current page, 1-based, already inside 1..pageCount. */
  page: number;
  pageCount: number;
  /** Pages shown each side of the current one. */
  siblingCount: number;
  /** Pages always shown at each end. */
  boundaryCount: number;
};

/**
 * The row of a long list of pages: the first and last few, the current one with its neighbours, and a
 * gap between. Always the same number of slots once the list is longer than the row
 * (`2 * boundaryCount + 2 * siblingCount + 3`), so the row doesn't change width as you page. To keep
 * it that way, a gap that would hide a single page shows that page instead: "1 … 3 4 5 … 9" never
 * becomes "1 … 4 5 6 … 9" with the gap standing for just the 2.
 */
export function getPageSlots({ page, pageCount, siblingCount, boundaryCount }: Window): PageSlot[] {
  const slotCount = 2 * boundaryCount + 2 * siblingCount + 3;
  if (pageCount <= slotCount) return range(1, pageCount);

  // The window of siblings, pushed against whichever end the current page is near
  const siblingsStart = Math.max(
    Math.min(page - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    pageCount - boundaryCount - 1,
  );

  return [
    ...range(1, boundaryCount),
    siblingsStart > boundaryCount + 2 ? 'start-gap' : boundaryCount + 1,
    ...range(siblingsStart, siblingsEnd),
    siblingsEnd < pageCount - boundaryCount - 1 ? 'end-gap' : pageCount - boundaryCount,
    ...range(pageCount - boundaryCount + 1, pageCount),
  ];
}
