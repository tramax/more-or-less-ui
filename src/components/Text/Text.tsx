import { forwardRef } from 'react';
import {
  TypeFrame,
  TYPE_DEFAULTS,
  type TypeColor,
  type TypeElement,
  type TypeProps,
} from '../_shared/TypeFrame';
import styles from './Text.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const TEXT_DEFAULTS = TYPE_DEFAULTS;

/** The elements Text can render. Interactive and form elements are other components' job. */
export type TextElement = TypeElement;

/** `less` / `normal` / `more` or a CSS color. Not a number: unlike the other props, it can't be pixels. */
export type TextColor = TypeColor;

export type TextProps = TypeProps & {
  /**
   * The element to render. Pick it for what the text is (a paragraph, a heading), not how it looks.
   * For a heading, prefer `Title`: it has the title type scale and font.
   */
  as?: TextElement;
};

/**
 * A run of text: a `span` unless `as` says otherwise. It sets its type size, weight and color and
 * nothing else, each defaulting to `normal`, and no margin (the space around it comes from the layout
 * it sits in, as with Card). The rest is _shared/TypeFrame, shared with Title.
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'span', ...props },
  ref,
) {
  return <TypeFrame {...props} ref={ref} as={as} classes={styles} />;
});
