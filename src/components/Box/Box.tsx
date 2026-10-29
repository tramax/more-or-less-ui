import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import styles from './Box.module.css';

const SCALE_SPEC = {
  // Each drives the CSS property of the same name. No defaults: a bare `<Box>` is a plain div, and
  // a prop only does something once you set it. Card (the styled surface) and Stack build on this.
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
  ],
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
