import { forwardRef } from 'react';
import { TypeFrame, TYPE_DEFAULTS, type TypeProps } from '../_shared/TypeFrame';
import styles from './Title.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const TITLE_DEFAULTS = TYPE_DEFAULTS;

/** The elements Title can render: a heading, always. Other display text is a Text. */
export type TitleElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type TitleProps = TypeProps & {
  /**
   * The heading level: where the section sits in the page's outline, not how big it looks (that is
   * `size`). Defaults to `h2`; a page usually has one `h1`.
   */
  as?: TitleElement;
};

/**
 * A heading: an `h2` unless `as` says otherwise. Text's props (`size`, `fontWeight`, `color`, each
 * defaulting to `normal`) on the title tokens: its own size and weight scales, font family and line
 * height. No margin; the space around it comes from the layout. The rest is _shared/TypeFrame.
 */
export const Title = forwardRef<HTMLHeadingElement, TitleProps>(function Title(
  { as = 'h2', ...props },
  ref,
) {
  return <TypeFrame {...props} ref={ref} as={as} classes={styles} rootClassName={styles.title} />;
});
