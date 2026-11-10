import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import sizes from '../_shared/Size.module.css';
import { useLinkProps } from '../_shared/useLinkProps';
import styles from './Link.module.css';

// No defaults on purpose: a link in a sentence is the size of the sentence (as Spinner is 1em). Pass
// `size` to set it free of the surrounding text.
const SCALE_SPEC = {
  // Empty on purpose: without it `resolveScaleProps` can't tell the other props from scale props
  direct: [],
  // `size` sets font-size only. Its classes are _shared/Size.module.css, since `size` is the only scale prop.
  compound: { size: ['fontSize'] },
} as const;

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> & {
  /** Sets the font size. Unset, the link is as big as the text around it. */
  size?: ScaleProp;
  /** This is the page the reader is on: sets `aria-current="page"` and takes the surrounding text color. */
  isCurrent?: boolean;
  /**
   * Not a link for now: no `href`, dimmed, and it does nothing when pressed. Still named and announced
   * as a disabled link (`aria-disabled`), so the reader knows it is there.
   */
  isDisabled?: boolean;
};

/**
 * A link: a real `<a href>`, so the browser's own behavior (a new tab, copy link address, middle
 * click) works. Inside a `LinkProvider`, a click on a link to a place in the app goes to your router
 * instead of loading the page; without one it is a plain anchor. A faint rule under the text (not
 * `text-decoration`) grows up into a highlight on hover.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { isCurrent = false, isDisabled = false, className, style, href, onClick, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(sizes, SCALE_SPEC, props);
  const linkProps = useLinkProps({
    href,
    target: rest.target,
    download: rest.download,
    onClick,
  });

  return (
    <a
      {...rest}
      {...(isDisabled ? { role: 'link', 'aria-disabled': true } : linkProps)}
      ref={ref}
      aria-current={isCurrent ? 'page' : rest['aria-current']}
      className={clsx(
        styles.link,
        classNames,
        isCurrent && styles.current,
        isDisabled && styles.disabled,
        className,
      )}
      style={{ ...scaleStyle, ...style }}
    />
  );
});
