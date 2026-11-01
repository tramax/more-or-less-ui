import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp, Variant } from '@/types/scale';
import placeholder from '../_shared/Placeholder.module.css';
import styles from './Text.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const TEXT_DEFAULTS = {
  size: 'normal',
  fontWeight: 'normal',
  color: 'normal',
} as const;

const SCALE_SPEC = {
  // Each drives the CSS property of the same name
  direct: ['fontWeight', 'color'],
  // `size` sets font-size only; there is no padding to scale, and a line-height in em follows it
  compound: { size: ['fontSize'] },
  // Every prop falls back to `normal`, so a bare `<Text>` is the same wherever it sits. It does not
  // follow a parent's size, weight or color: pass the prop to change it.
  defaults: TEXT_DEFAULTS,
} as const;

/** The elements Text can render. Interactive and form elements are other components' job. */
export type TextElement =
  'span' | 'p' | 'div' | 'strong' | 'em' | 'small' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * `less` / `normal` / `more` or a CSS color. Not a number: unlike the other props, it can't be pixels.
 * (`Variant | string` would collapse to `string`; the intersection keeps the variants in autocomplete.)
 */
export type TextColor = Variant | (string & Record<never, never>);

export type TextProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  /** The element to render. Pick it for what the text is (a paragraph, a heading), not how it looks. */
  as?: TextElement;
  size?: ScaleProp;
  fontWeight?: ScaleProp;
  /**
   * How much the text stands out: quiet secondary text (`less`), the plain text color (`normal`), the
   * brand color (`more`), for the one thing that should catch the eye. It says nothing about meaning
   * (error, success); for that, pass a CSS color such as `var(--color-danger)`.
   */
  color?: TextColor;
};

/**
 * A run of text: a `span` unless `as` says otherwise. It sets its type size, weight and color and
 * nothing else, each defaulting to `normal`, and no margin (the space around it comes from the layout
 * it sits in, as with Card).
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'span', fontWeight, className, style, ...props },
  ref,
) {
  // Typed as span, whatever `as` is: TypeScript resolves a union of tags to div's ref, and a span's
  // ref type is HTMLElement's (HTMLSpanElement adds nothing), which is what every element here forwards
  const Element = as as 'span';
  const {
    classNames,
    style: scaleStyle,
    rest,
  } = resolveScaleProps(styles, SCALE_SPEC, {
    ...props,
    // A weight has no unit, so a number is 700, not "700px" as it would be for the other props
    fontWeight: typeof fontWeight === 'number' ? String(fontWeight) : fontWeight,
  });

  return (
    <Element
      {...rest}
      ref={ref}
      // A block as long as its content inside aria-busy="true" (see _shared/Placeholder)
      className={clsx(styles.text, placeholder.placeholder, classNames, className)}
      style={{ ...scaleStyle, ...style }}
    />
  );
});
