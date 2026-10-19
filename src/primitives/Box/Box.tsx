import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import styles from './Box.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const BOX_DEFAULTS = {
  padding: 'normal',
  borderRadius: 'normal',
  background: 'normal',
} as const;

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
    'borderRadius',
    'boxShadow',
    'background',
  ],
  // Opinionated starting look: a padded, rounded surface. Everything else
  // (margin, shadow, per-side overrides) is opt-in so layout stays predictable.
  // Opt out of a default with an escape-hatch value, e.g. padding={0} or background="less".
  defaults: BOX_DEFAULTS,
} as const;

type ScalePropName = (typeof SCALE_SPEC.direct)[number];

export type BoxProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'> &
  Partial<Record<ScalePropName, ScaleProp>>;

export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box(
  { className, style, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(styles, SCALE_SPEC, props);

  return (
    <div
      {...rest}
      ref={ref}
      className={clsx(classNames, className)}
      style={{ ...scaleStyle, ...style }}
    />
  );
});
