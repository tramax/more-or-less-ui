/**
 * More or Less UI — Public API
 * A React UI library built on relative scaling (more/less/normal) with CSS Variables for theming.
 */

// Theme
export { ThemeProvider, useTheme } from '@/theme';

// Scale types
export type { ScaleProp, Variant } from '@/types/scale';
export { isVariant } from '@/types/scale';

// CSS Variable utilities
export {
  getCSSVariable,
  getCSSVariablesByPrefix,
  getScaleTokens,
  getColorTokens,
  setCSSVariable,
} from '@/utils/cssVars';

// clsx utility
export { clsx } from '@/utils/clsx';
export type { ClassValue } from '@/utils/clsx';

// Styles entry point (import 'more-or-less-ui/styles.css')
export {} from '@/styles.css';

// Primitives
export { Box } from '@/primitives';
export type { BoxProps } from '@/primitives';

// Primitives (to be implemented)
// export { Flex } from '@/primitives/Flex';
// export { Stack } from '@/primitives/Stack';
// export { Grid } from '@/primitives/Grid';
// export { Text } from '@/primitives/Text';

// Components
export { Button } from '@/components';
export type { ButtonProps } from '@/components';

// Components (to be implemented)
// export { Card } from '@/components/Card';
// export { Input } from '@/components/Input';
// export { Textarea } from '@/components/Textarea';
// export { Select } from '@/components/Select';
