import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import styles from './Box.module.css';

const SCALE_SPEC = {
  // Each drives the CSS property of the same name
  direct: [
    'padding',
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'paddingBottom',
    'margin',
    'marginLeft',
    'marginRight',
    'marginTop',
    'marginBottom',
    'gap',
    'width',
    'height',
    'minWidth',
    'minHeight',
    'borderRadius',
    'boxShadow',
    'background',
  ],
  // Opinionated starting look: a padded, rounded surface that spaces its children. Everything else
  // (margin, shadow, dimensions, per-side overrides) is opt-in so layout stays predictable.
  // Opt out of a default with an escape-hatch value, e.g. padding={0} or background="less".
  defaults: {
    padding: 'normal',
    gap: 'normal',
    borderRadius: 'normal',
    background: 'normal',
  },
} as const;

type ScalePropName = (typeof SCALE_SPEC.direct)[number];

export interface BoxProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'color'>, Partial<Record<ScalePropName, ScaleProp>> {
  // Layout: plain CSS pass-through, no scale
  display?: CSSProperties['display'];
  flex?: CSSProperties['flex'];
  flexDirection?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box(
  { display, flex, flexDirection, alignItems, justifyContent, className, style, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(styles, SCALE_SPEC, props);

  return (
    <div
      {...rest}
      ref={ref}
      className={clsx(classNames, className)}
      style={{ display, flex, flexDirection, alignItems, justifyContent, ...scaleStyle, ...style }}
    />
  );
});
