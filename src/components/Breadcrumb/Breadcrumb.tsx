import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { ChevronIcon } from '../_shared/ChevronIcon';
import sizes from '../_shared/Size.module.css';
import { Link } from '../Link';
import styles from './Breadcrumb.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const BREADCRUMB_DEFAULTS = {
  size: 'normal',
} as const;

// `size` sets font-size only: the gaps and the separator are in em (see Breadcrumb.module.css), so they
// follow it, escape-hatch values included. Its classes are _shared/Size.module.css, since `size` is the
// only scale prop.
const SCALE_SPEC = {
  // Empty, so the direct props are inferred as none rather than as any string
  direct: [],
  compound: { size: ['fontSize'] },
  defaults: BREADCRUMB_DEFAULTS,
} as const;

export type BreadcrumbItem = {
  /** The name shown. */
  label: string;
  /**
   * Where it goes, as for a Link (a LinkProvider sends it to your router). Leave it out for a level
   * that is not a page, or for the current page, which is already where the reader is.
   */
  href?: string;
};

export type BreadcrumbProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'children'> & {
  /**
   * The trail, from the top of the site down to the current page. The last item is the current page:
   * it is marked `aria-current="page"` and drops the link color. Give it an `href` and it is still a
   * link (to reload the page, or copy its address); leave it out and it is plain text.
   */
  items: BreadcrumbItem[];
  /** Sets the font size; the gaps and the separator follow it. `1em` takes the surrounding text's size. */
  size?: ScaleProp;
  /**
   * Names the landmark. Default `Breadcrumb`; set it for another language, or when a page has more than
   * one trail. `aria-labelledby` replaces it.
   */
  'aria-label'?: string;
};

/**
 * Where the reader is in a site, and the way back up: a row of links from the top level down to the
 * current page. For moving between the sections of one page use Tabs; for the steps of a flow use a
 * Stepper.
 *
 * A `<nav>` landmark holding an ordered list (the order is the meaning), as the WAI-ARIA APG breadcrumb
 * pattern. The separators are decorative and hidden from assistive tech. Each item is a Link, so a
 * `LinkProvider` routes them with no page load. A long trail wraps onto more lines.
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  {
    items,
    size,
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

  if (items.length === 0) return null;

  return (
    <nav
      {...rest}
      ref={ref}
      aria-label={ariaLabel ?? (labelledBy ? undefined : 'Breadcrumb')}
      aria-labelledby={labelledBy}
      className={clsx(styles.root, classNames, className)}
      style={{ ...scaleStyle, ...style }}
    >
      {/* role="list": Safari and VoiceOver stop announcing a list whose bullets are removed */}
      <ol className={styles.list} role="list">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li
              key={`${index}-${item.label}`}
              className={clsx(styles.item, isCurrent && styles.current)}
            >
              {item.href === undefined ? (
                <span aria-current={isCurrent ? 'page' : undefined}>{item.label}</span>
              ) : (
                <Link href={item.href} isCurrent={isCurrent}>
                  {item.label}
                </Link>
              )}
              {!isCurrent && <ChevronIcon className={styles.separator} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
