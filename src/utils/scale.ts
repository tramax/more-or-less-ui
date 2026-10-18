import type { CSSProperties } from 'react';
import { isVariant, type ScaleProp, type Variant } from '@/types/scale';

/**
 * Which props a component treats as scale props.
 * - `direct`: each drives the CSS property of the same name (`padding` → `padding`)
 * - `compound`: each drives several CSS properties (`size` → `width` + `height`)
 * - `defaults`: the variant a prop gets when the caller leaves it `undefined`; props not listed here
 *   stay unset. Opt out of a default with an escape-hatch value such as `0`.
 */
export interface ScaleSpec<D extends string, C extends string = never> {
  direct?: readonly D[];
  compound?: Record<C, readonly (keyof CSSProperties)[]>;
  defaults?: Partial<Record<NoInfer<D | C>, Variant>>;
}

/** CSS Module class map as imported (`import styles from './X.module.css'`). */
export type ClassMap = Record<string, string | undefined>;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Escape-hatch value → CSS value. Numbers are pixels. */
export function toCssValue(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Class for a variant value, looked up by convention as `<prop><Variant>`:
 * `padding="more"` → `styles.paddingMore`. Returns undefined for escape-hatch values and undefined.
 */
export function getVariantClass(
  classes: ClassMap,
  prop: string,
  value: ScaleProp,
): string | undefined {
  return isVariant(value) ? classes[`${prop}${capitalize(value)}`] : undefined;
}

/**
 * Pull the scale props out of a component's props and resolve them into what it needs:
 * - `classNames`: CSS Module classes for `less` / `normal` / `more` (including `spec.defaults`)
 * - `style`: inline styles for escape-hatch values (anything else: '1.5rem', 12, '50%')
 * - `rest`: the remaining props, safe to spread onto the DOM element
 */
export function resolveScaleProps<
  D extends string,
  C extends string = never,
  P extends Partial<Record<D | C, ScaleProp>> = Partial<Record<D | C, ScaleProp>>,
>(
  classes: ClassMap,
  spec: ScaleSpec<D, C>,
  props: P,
): { classNames: string[]; style: CSSProperties; rest: Omit<P, D | C> } {
  const classNames: string[] = [];
  const style: Record<string, string> = {};
  const rest: Record<string, unknown> = { ...props };

  const resolve = (prop: string, cssProperties: readonly string[]) => {
    const value =
      (props as Record<string, ScaleProp>)[prop] ??
      (spec.defaults as Record<string, Variant> | undefined)?.[prop];
    delete rest[prop];
    if (value === undefined) return;

    if (isVariant(value)) {
      const className = getVariantClass(classes, prop, value);
      if (className) classNames.push(className);
    } else {
      for (const cssProperty of cssProperties) style[cssProperty] = toCssValue(value);
    }
  };

  for (const prop of spec.direct ?? []) resolve(prop, [prop]);
  for (const [prop, cssProperties] of Object.entries(spec.compound ?? {})) {
    resolve(prop, cssProperties as readonly string[]);
  }

  return { classNames, style: style as CSSProperties, rest: rest as Omit<P, D | C> };
}
