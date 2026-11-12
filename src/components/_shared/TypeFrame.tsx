import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps, type ClassMap } from '@/utils/scale';
import type { ScaleProp, Variant } from '@/types/scale';
import placeholder from './Placeholder.module.css';
import typeStyles from './Type.module.css';

/** Every prop falls back to `normal`, for Text and Title alike. */
export const TYPE_DEFAULTS = {
  size: 'normal',
  fontWeight: 'normal',
  color: 'normal',
} as const;

const SCALE_SPEC = {
  // Each drives the CSS property of the same name
  direct: ['fontWeight', 'color'],
  // `size` sets font-size only; there is no padding to scale, and a line-height in em follows it
  compound: { size: ['fontSize'] },
  // A bare Text or Title is the same wherever it sits. It does not follow a parent's size, weight or
  // color: pass the prop to change it.
  defaults: TYPE_DEFAULTS,
} as const;

/** Every element a run of type can be. Interactive and form elements are other components' job. */
export type TypeElement =
  'span' | 'p' | 'div' | 'strong' | 'em' | 'small' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * `less` / `normal` / `more` or a CSS color. Not a number: unlike the other props, it can't be pixels.
 * (`Variant | string` would collapse to `string`; the intersection keeps the variants in autocomplete.)
 */
export type TypeColor = Variant | (string & Record<never, never>);

/** The props Text and Title share. */
export type TypeProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  size?: ScaleProp;
  fontWeight?: ScaleProp;
  /**
   * How much the text stands out: quiet secondary text (`less`), the plain text color (`normal`), the
   * brand color (`more`), for the one thing that should catch the eye. It says nothing about meaning
   * (error, success); for that, pass a CSS color such as `var(--color-danger)`.
   */
  color?: TypeColor;
};

const VARIANT_KEYS = ['Less', 'Normal', 'More'] as const;

/**
 * The classes the scale props are looked up in: `size*` and `fontWeight*` from the component's module,
 * `color*` from Type.module.css. Built key by key, not as `{ ...typeStyles, ...classes }`: under Vitest
 * a CSS module is a Proxy with no keys to spread, and the spread would hide every class in the tests.
 */
function typeClasses(classes: ClassMap): ClassMap {
  const map: ClassMap = {};
  for (const variant of VARIANT_KEYS) {
    map[`size${variant}`] = classes[`size${variant}`];
    map[`fontWeight${variant}`] = classes[`fontWeight${variant}`];
    map[`color${variant}`] = typeStyles[`color${variant}`];
  }
  return map;
}

type TypeFrameProps = TypeProps & {
  as: TypeElement;
  /**
   * The component's own CSS module: its `size*` and `fontWeight*` classes, which read its own tokens.
   * The `color*` classes are Type.module.css's, whatever this holds.
   */
  classes: ClassMap;
  /** The component's own class for its root (Title's font and line height), before the caller's. */
  rootClassName?: string;
};

/**
 * The frame of a run of type (Text, Title): the element, the scale props resolved against the
 * component's classes, the margin reset, the loading placeholder, and the ref. A component passes its
 * own `size*` / `fontWeight*` classes and default element, and writes nothing else.
 */
export const TypeFrame = forwardRef<HTMLElement, TypeFrameProps>(function TypeFrame(
  { as, classes, rootClassName, fontWeight, className, style, ...props },
  ref,
) {
  // Typed as span, whatever `as` is: TypeScript resolves a union of tags to div's ref, and a span's
  // ref type is HTMLElement's (HTMLSpanElement adds nothing), which is what every element here forwards
  const Element = as as 'span';
  const {
    classNames,
    style: scaleStyle,
    rest,
  } = resolveScaleProps(typeClasses(classes), SCALE_SPEC, {
    ...props,
    // A weight has no unit, so a number is 700, not "700px" as it would be for the other props
    fontWeight: typeof fontWeight === 'number' ? String(fontWeight) : fontWeight,
  });

  return (
    <Element
      {...rest}
      ref={ref}
      // A block as long as its content inside aria-busy="true" (see _shared/Placeholder)
      className={clsx(
        typeStyles.root,
        rootClassName,
        placeholder.placeholder,
        classNames,
        className,
      )}
      style={{ ...scaleStyle, ...style }}
    />
  );
});
