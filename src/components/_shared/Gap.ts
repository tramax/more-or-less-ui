import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import styles from './Gap.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const GAP_DEFAULTS = { gap: 'normal' } as const;

const GAP_SPEC = { direct: ['gap'], defaults: GAP_DEFAULTS } as const;

/**
 * The `gap` prop of Stack and Grid: `less` / `normal` / `more` (default `normal`) or any CSS value
 * (`gap={0}` turns it off). Returns what resolveScaleProps does: the class, the inline style for an
 * escape-hatch value, and `rest` without `gap`.
 */
export const resolveGap = <P extends { gap?: ScaleProp }>(props: P) =>
  resolveScaleProps(styles, GAP_SPEC, props);
