import { forwardRef } from 'react';
import { Box, type BoxProps } from '@/components/Box';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import styles from './Card.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const CARD_DEFAULTS = {
  padding: 'normal',
  borderRadius: 'normal',
  boxShadow: 'normal',
  background: 'normal',
} as const;

const SCALE_SPEC = {
  // Each drives the CSS property of the same name. Padding is Box's: Card renders a Box.
  direct: ['borderRadius', 'boxShadow', 'background'],
  // Every prop falls back to `normal`, so `<Card />` is a styled surface out of the box. The
  // per-side padding props have no default: they only override the `padding` shorthand.
  // Opt out with an escape-hatch value: padding={0}, boxShadow="none", background="transparent".
  defaults: CARD_DEFAULTS,
} as const;

type SurfacePropName = (typeof SCALE_SPEC.direct)[number];

// No margin: a card sits in a layout (a Stack's gap, or a wrapping Box) that decides the space around it
export type CardProps = Omit<
  BoxProps,
  'margin' | 'marginLeft' | 'marginRight' | 'marginTop' | 'marginBottom'
> &
  Partial<Record<SurfacePropName, ScaleProp>>;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, style, padding = CARD_DEFAULTS.padding, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(styles, SCALE_SPEC, props);

  return (
    <Box
      {...rest}
      ref={ref}
      padding={padding}
      className={clsx(classNames, className)}
      style={{ ...scaleStyle, ...style }}
    />
  );
});
