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
export {
  Avatar,
  Banner,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  Divider,
  Drawer,
  Grid,
  Indicator,
  Menu,
  Popover,
  Progress,
  Radio,
  Select,
  Spinner,
  Stack,
  Text,
  TextField,
  Textarea,
  Tooltip,
} from '@/components';
export type {
  AvatarProps,
  BannerProps,
  BoxProps,
  ButtonProps,
  CardProps,
  CheckboxProps,
  CheckboxOption,
  ChipProps,
  DialogProps,
  DividerProps,
  DrawerPlacement,
  DrawerProps,
  GridProps,
  IndicatorProps,
  MenuProps,
  MenuItem,
  PopoverProps,
  ProgressProps,
  RadioProps,
  RadioOption,
  SelectProps,
  SelectOption,
  SpinnerProps,
  StackProps,
  TextProps,
  TextElement,
  TextColor,
  TextFieldProps,
  TextareaProps,
  TooltipProps,
} from '@/components';
