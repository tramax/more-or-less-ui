/**
 * Scale system types.
 * Every sizing/styling prop accepts three intentional variants + an escape hatch.
 */

export type Variant = 'less' | 'normal' | 'more';

/**
 * Prop type accepting:
 * - Variant keywords: 'less' | 'normal' | 'more'
 * - Any CSS value as string: '1.5rem', '50%', '2px'
 * - Numbers (treated as pixels): 16, 24
 * - undefined (defaults to 'normal')
 */
export type ScaleProp = Variant | string | number | undefined;

/**
 * Check if a value is one of the three intentional variants.
 */
export function isVariant(value: ScaleProp): value is Variant {
  return value === 'less' || value === 'normal' || value === 'more';
}
