import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { ChevronIcon } from '../_shared/ChevronIcon';
import sizes from '../_shared/Size.module.css';
import { useLinkProps } from '../_shared/useLinkProps';
import { getPageSlots } from './pageSlots';
import styles from './Pagination.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const PAGINATION_DEFAULTS = {
  size: 'normal',
} as const;

// Not scale props, so not in the spec above: how many pages the row shows
const DEFAULT_SIBLING_COUNT = 1;
const DEFAULT_BOUNDARY_COUNT = 1;

// `size` sets font-size only: the buttons and the gaps are in em (see Pagination.module.css), so they
// follow it, escape-hatch values included. Its classes are _shared/Size.module.css, since `size` is the
// only scale prop.
const SCALE_SPEC = {
  // Empty, so the direct props are inferred as none rather than as any string
  direct: [],
  compound: { size: ['fontSize'] },
  defaults: PAGINATION_DEFAULTS,
} as const;

export type PaginationLabels = {
  /** The previous-page button's name. Default `Previous page`. */
  previous?: string;
  /** The next-page button's name. Default `Next page`. */
  next?: string;
  /** The name of the button for one page, which shows only its number. Default `Page 3`. */
  page?: (page: number) => string;
};

const DEFAULT_LABELS = {
  previous: 'Previous page',
  next: 'Next page',
  page: (page: number) => `Page ${page}`,
} satisfies Required<PaginationLabels>;

export type PaginationProps = Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'color' | 'children'
> & {
  /**
   * The current page, counting from 1. Always controlled: the parent owns it, since what the screen
   * shows follows it (and it belongs in the URL). Out of range, it is the nearest page that exists.
   */
  page: number;
  /** How many pages there are (not how many items: that is `Math.ceil(total / pageSize)`). With 1 or fewer, nothing is drawn. */
  pageCount: number;
  /** Pages shown each side of the current one. Default 1. */
  siblingCount?: number;
  /** Pages always shown at each end of the row. Default 1. */
  boundaryCount?: number;
  /**
   * Nothing can be pressed. The buttons are disabled and leave the tab order; a link is dimmed and not
   * a link for now.
   */
  isDisabled?: boolean;
  /** Sets the font size; the buttons and the gaps follow it. `1em` takes the surrounding text's size. */
  size?: ScaleProp;
  /** The names of the buttons, for another language. Each one you leave out is the English default. */
  labels?: PaginationLabels;
  /**
   * Names the landmark. Default `Pagination`; set it for another language, or when a page has more
   * than one (a table's and a list's). `aria-labelledby` replaces it.
   */
  'aria-label'?: string;
} & (
    | {
        /**
         * Called with the page that was chosen (not when the current page is chosen again). Without
         * `getHref`, the pages are buttons and this is how you go there.
         */
        onChange: (page: number) => void;
        getHref?: (page: number) => string;
      }
    | {
        /**
         * Link mode: the address of a page. The pages are links (`<a href>`), so "open in new tab" and
         * crawlers work, and under a `LinkProvider` a click goes to your router with no page load. The
         * `href` is written as for a Link.
         */
        getHref: (page: number) => string;
        /** Still called on a plain click, before the link is followed; use it for analytics or to scroll up. */
        onChange?: (page: number) => void;
      }
  );

type ControlProps = {
  page: number;
  label: string;
  className: string;
  children: ReactNode;
  isCurrent?: boolean;
  /** The whole Pagination is disabled. */
  isDisabled: boolean;
  /** Previous on the first page, next on the last: dimmed, but still where the focus can stay. */
  isEdge?: boolean;
  getHref: ((page: number) => string) | undefined;
  onSelect: ((page: number) => void) | undefined;
};

/**
 * One thing to press: a `<button>`, or in link mode an `<a href>` (a component of its own, since
 * `useLinkProps` is a hook and there is one per link).
 */
function PageControl({
  page,
  label,
  className,
  children,
  isCurrent = false,
  isDisabled,
  isEdge = false,
  getHref,
  onSelect,
}: ControlProps) {
  const isBlocked = isDisabled || isEdge;
  const select = () => {
    if (!isCurrent) onSelect?.(page);
  };
  // Not asked for the page before the first or after the last: that is no page
  const linkProps = useLinkProps({
    href: isBlocked ? undefined : getHref?.(page),
    onClick: select,
  });
  const current = isCurrent ? ('page' as const) : undefined;

  if (getHref) {
    return (
      <a
        {...(isBlocked
          ? // Not a link for now, as Link's `isDisabled`. An edge stays focusable (`tabIndex`), so
            // pressing Next onto the last page doesn't drop the focus on the body
            { role: 'link', 'aria-disabled': true, tabIndex: isDisabled ? undefined : 0 }
          : linkProps)}
        aria-label={label}
        aria-current={current}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      // An edge is `aria-disabled`, not `disabled`: a disabled button can't keep the focus
      disabled={isDisabled}
      aria-disabled={isEdge && !isDisabled ? true : undefined}
      aria-label={label}
      aria-current={current}
      className={className}
      onClick={isBlocked ? undefined : select}
    >
      {children}
    </button>
  );
}

const toCount = (value: number, min: number) =>
  Number.isFinite(value) ? Math.max(min, Math.floor(value)) : min;

/**
 * Moving between the pages of a long list or table: previous and next, the first and last pages, and
 * the ones around the current page. For the sections of one page use Tabs; for where the reader is in a
 * site use Breadcrumb.
 *
 * A `<nav>` landmark holding an ordered list, as Breadcrumb. The pages are buttons, or with `getHref`
 * real links (which a `LinkProvider` sends to your router). The row is the same width on every page,
 * and the gaps ("…") are decoration: any page is a press of previous or next away from one shown.
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    page,
    pageCount,
    siblingCount,
    boundaryCount,
    isDisabled = false,
    size,
    labels,
    onChange,
    getHref,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    className,
    style,
    ...props
  },
  ref,
) {
  const {
    classNames,
    style: scaleStyle,
    rest,
  } = resolveScaleProps(sizes, SCALE_SPEC, { ...props, size });

  const count = toCount(pageCount, 0);
  if (count <= 1) return null;

  const current = Math.min(toCount(page, 1), count);
  const slots = getPageSlots({
    page: current,
    pageCount: count,
    siblingCount: toCount(siblingCount ?? DEFAULT_SIBLING_COUNT, 0),
    boundaryCount: toCount(boundaryCount ?? DEFAULT_BOUNDARY_COUNT, 0),
  });
  const { previous, next, page: pageLabel } = { ...DEFAULT_LABELS, ...labels };
  const control = { isDisabled, getHref, onSelect: onChange };

  return (
    <nav
      {...rest}
      ref={ref}
      aria-label={ariaLabel ?? (labelledBy ? undefined : 'Pagination')}
      aria-labelledby={labelledBy}
      className={clsx(styles.root, classNames, className)}
      style={{ ...scaleStyle, ...style }}
    >
      {/* role="list": Safari and VoiceOver stop announcing a list whose bullets are removed */}
      <ol className={styles.list} role="list">
        <li>
          <PageControl
            {...control}
            page={current - 1}
            label={previous}
            className={clsx(styles.control, styles.previous)}
            isEdge={current === 1}
          >
            <ChevronIcon className={styles.chevron} />
          </PageControl>
        </li>
        {slots.map((slot) =>
          typeof slot === 'number' ? (
            <li key={slot}>
              <PageControl
                {...control}
                page={slot}
                label={pageLabel(slot)}
                className={clsx(styles.control, slot === current && styles.current)}
                isCurrent={slot === current}
              >
                {slot}
              </PageControl>
            </li>
          ) : (
            // Decoration, and not counted by a screen reader: the gap is not a place to go
            <li key={slot} className={styles.gap} aria-hidden="true">
              …
            </li>
          ),
        )}
        <li>
          <PageControl
            {...control}
            page={current + 1}
            label={next}
            className={clsx(styles.control, styles.next)}
            isEdge={current === count}
          >
            <ChevronIcon className={styles.chevron} />
          </PageControl>
        </li>
      </ol>
    </nav>
  );
});
