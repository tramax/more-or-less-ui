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
  Calendar,
  Card,
  Checkbox,
  Chip,
  Collapsible,
  DateField,
  DatePicker,
  Dialog,
  Divider,
  Drawer,
  FileUpload,
  Grid,
  Indicator,
  Link,
  LinkProvider,
  Menu,
  Pagination,
  Popover,
  Progress,
  Radio,
  SegmentedControl,
  Select,
  Slider,
  Spinner,
  Stack,
  Table,
  Tabs,
  Text,
  TextField,
  Textarea,
  Title,
  ToastProvider,
  Toggle,
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
  CalendarLabels,
  CalendarProps,
  CalendarView,
  CardProps,
  CheckboxProps,
  CheckboxOption,
  ChipProps,
  CollapsibleProps,
  DateFieldLabels,
  DateFieldPlaceholders,
  DateFieldProps,
  DatePickerLabels,
  DatePickerProps,
  DatePreset,
  DialogProps,
  DividerProps,
  DrawerPlacement,
  DrawerProps,
  FileRejection,
  FileStatus,
  FileUploadProps,
  GridProps,
  IndicatorProps,
  LinkProps,
  LinkProviderProps,
  MenuProps,
  MenuItem,
  PaginationLabels,
  PaginationProps,
  PopoverProps,
  ProgressProps,
  RadioProps,
  RadioOption,
  RejectionReason,
  SegmentedControlProps,
  SegmentOption,
  SelectProps,
  SelectOption,
  SliderProps,
  SpinnerProps,
  StackProps,
  TableColumn,
  TableLabels,
  TableProps,
  TableSort,
  TabsProps,
  TabItem,
  TextProps,
  TextElement,
  TextColor,
  TextFieldProps,
  TextareaProps,
  TitleElement,
  TitleProps,
  ToastApi,
  ToastChanges,
  ToastOptions,
  ToastProviderProps,
  ToggleProps,
  TooltipProps,
  UploadControl,
  UploadFile,
  Weekday,
} from '@/components';

// Date and time values: local strings (not instants), and the helpers between them and a server's
export {
  fromDate,
  fromInstant,
  isLocalDate,
  isLocalDateTime,
  isLocalTime,
  toDate,
  toInstant,
  today,
} from '@/components/_shared/dateValue';
export type {
  LocalDate,
  LocalDateTime,
  LocalMonth,
  LocalTime,
} from '@/components/_shared/dateValue';
