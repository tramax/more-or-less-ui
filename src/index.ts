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
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Chip,
  Collapsible,
  Dialog,
  Divider,
  Drawer,
  Grid,
  Indicator,
  Link,
  LinkProvider,
  Menu,
  Popover,
  Progress,
  Radio,
  SegmentedControl,
  Select,
  Slider,
  Spinner,
  Stack,
  Tabs,
  Text,
  TextField,
  Textarea,
  ToastProvider,
  Tooltip,
  useToast,
} from '@/components';
export type {
  AvatarProps,
  BannerProps,
  BoxProps,
  BreadcrumbItem,
  BreadcrumbProps,
  ButtonProps,
  CardProps,
  CheckboxProps,
  CheckboxOption,
  ChipProps,
  CollapsibleProps,
  DialogProps,
  DividerProps,
  DrawerPlacement,
  DrawerProps,
  GridProps,
  IndicatorProps,
  LinkProps,
  LinkProviderProps,
  MenuProps,
  MenuItem,
  PopoverProps,
  ProgressProps,
  RadioProps,
  RadioOption,
  SegmentedControlProps,
  SegmentOption,
  SelectProps,
  SelectOption,
  SliderProps,
  SpinnerProps,
  StackProps,
  TabsProps,
  TabItem,
  TextProps,
  TextElement,
  TextColor,
  TextFieldProps,
  TextareaProps,
  ToastApi,
  ToastChanges,
  ToastOptions,
  ToastProviderProps,
  TooltipProps,
} from '@/components';
