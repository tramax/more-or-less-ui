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

// Components
export { Box, Button, Checkbox, Radio, Select, TextField, Textarea } from '@/components';
export type {
  BoxProps,
  ButtonProps,
  CheckboxProps,
  CheckboxOption,
  RadioProps,
  RadioOption,
  SelectProps,
  SelectOption,
  TextFieldProps,
  TextareaProps,
} from '@/components';

// Components (to be implemented)
// export { Flex } from '@/components/Flex';
// export { Stack } from '@/components/Stack';
// export { Grid } from '@/components/Grid';
// export { Text } from '@/components/Text';
// export { Card } from '@/components/Card';
