import { forwardRef, useEffect, useRef, type KeyboardEvent } from 'react';
import { isLocalDate, warnIfNotLocal, type LocalDate } from '../_shared/dateValue';
import { IconButton } from '../_shared/IconButton';
import type { NameProps } from '../_shared/types';
import { useControlledState } from '../_shared/useControlledState';
import { Calendar, type CalendarLabels, type CalendarProps } from '../Calendar/Calendar';
import { isUnavailable } from '../Calendar/calendarMath';
import { Chip } from '../Chip';
import {
  DateFieldBase,
  type DateFieldLabels,
  type DateFieldOwnProps,
} from '../DateField/DateField';
import { Popover } from '../Popover';
import { CalendarIcon } from './CalendarIcon';
import styles from './DatePicker.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export { TEXT_FIELD_DEFAULTS as DATEPICKER_DEFAULTS } from '../_shared/TextFieldFrame';

/** A shortcut in the popup: a button that chooses a date at once ("Today", "Tomorrow"). */
export type DatePreset = {
  label: string;
  /** The date it chooses, a local date. Compute it when you render (`today()`), not once. */
  value: LocalDate;
};

/** The names of the segments, of the previous and next buttons, and of the calendar button. */
export type DatePickerLabels = DateFieldLabels &
  CalendarLabels & {
    /** The name of the button that opens the calendar, and of the calendar's popup. Default `Choose date`. */
    calendar?: string;
  };

export type DatePickerProps = Omit<DateFieldOwnProps, 'labels'> &
  NameProps &
  Pick<CalendarProps, 'min' | 'max' | 'isDateDisabled' | 'firstDayOfWeek'> & {
    /** Shortcuts under the calendar. One that is outside `min`..`max`, or disabled, can't be pressed. */
    presets?: DatePreset[];
    /** The names of the segments and buttons, for another language. */
    labels?: DatePickerLabels;
    /** Controlled: whether the calendar is open. Pair it with `onOpenChange`. */
    isOpen?: boolean;
    /** Whether the calendar starts open, when uncontrolled. */
    defaultIsOpen?: boolean;
    /** Called with the new state when the button, Alt+Down, Escape or a press outside changes it. */
    onOpenChange?: (isOpen: boolean) => void;
  };

const validDate = (value: LocalDate | null | undefined): LocalDate | null =>
  value && isLocalDate(value) ? value : null;

/**
 * A date field with a calendar to pick it from, for a date near today (a booking, a due date): the typing
 * of `DateField`, and a button at the end of the field that opens a `Calendar` in a popup. Either one
 * sets the same value, and the calendar follows what is typed. Value is a `LocalDate`.
 *
 * `min`, `max` and `isDateDisabled` limit the calendar and the presets, not the typing: the field takes
 * whatever date is typed, as a text field takes text, and the caller checks it (`date < min` compares as
 * dates do) and says so with `error`.
 *
 * Alt+Down in the field opens the calendar, as the date picker pattern asks. Choosing a date closes it.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    value: valueProp,
    defaultValue,
    onChange,
    min,
    max,
    isDateDisabled,
    firstDayOfWeek,
    presets,
    labels,
    locale,
    isOpen: isOpenProp,
    defaultIsOpen = false,
    onOpenChange,
    onKeyDown,
    ...fieldProps
  },
  ref,
) {
  const { size, isDisabled = false, isReadOnly = false } = fieldProps;
  const { calendar: calendarName = 'Choose date', previous, next, ...fieldLabels } = labels ?? {};
  const isLocked = isDisabled || isReadOnly;

  useEffect(() => {
    warnIfNotLocal('DatePicker', 'value', valueProp, valueProp == null || isLocalDate(valueProp));
    warnIfNotLocal(
      'DatePicker',
      'defaultValue',
      defaultValue,
      defaultValue == null || isLocalDate(defaultValue),
    );
  }, [valueProp, defaultValue]);

  // The value lives here, not in the field, because the calendar shows it too
  const [value, recordValue] = useControlledState<LocalDate | null>(
    valueProp === undefined ? undefined : validDate(valueProp),
    validDate(defaultValue),
  );
  const change = (date: LocalDate | null) => {
    recordValue(date);
    onChange?.(date);
  };

  const [isOpen, recordOpen] = useControlledState<boolean>(isOpenProp, defaultIsOpen);
  const setOpen = (open: boolean) => {
    recordOpen(open);
    onOpenChange?.(open);
  };

  // Opened by the person (the button, Alt+Down), the calendar takes focus; one that starts open, or that
  // the caller opens, doesn't take it from wherever the person is
  const calendarRef = useRef<HTMLDivElement>(null);
  const isFocusWanted = useRef(false);
  useEffect(() => {
    if (!isOpen || !isFocusWanted.current) return;
    isFocusWanted.current = false;
    // After Popover has shown itself: a panel that isn't showing can't take focus
    calendarRef.current?.querySelector<HTMLElement>('[data-cell][tabindex="0"]')?.focus();
  }, [isOpen]);

  // Only what was given: a key that is `undefined` would replace the calendar's default name
  const calendarLabels: CalendarLabels = {
    ...(previous && { previous }),
    ...(next && { next }),
  };

  const minDate = validDate(min) ?? undefined;
  const maxDate = validDate(max) ?? undefined;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || isLocked) return;
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      isFocusWanted.current = true;
      setOpen(true);
    }
  };

  const button = (
    <IconButton
      label={calendarName}
      icon={CalendarIcon}
      isDisabled={isLocked}
      onClick={() => {
        isFocusWanted.current = !isOpen;
      }}
    />
  );

  return (
    <DateFieldBase
      {...fieldProps}
      value={value}
      onChange={change}
      locale={locale}
      labels={fieldLabels}
      onKeyDown={handleKeyDown}
      ref={ref}
      end={
        <Popover
          trigger={button}
          aria-label={calendarName}
          placement="bottom"
          align="end"
          isOpen={isOpen}
          onOpenChange={setOpen}
          className={styles.popup}
        >
          <Calendar
            ref={calendarRef}
            size={size}
            value={value}
            onChange={(date) => {
              change(date);
              setOpen(false);
            }}
            min={minDate}
            max={maxDate}
            isDateDisabled={isDateDisabled}
            firstDayOfWeek={firstDayOfWeek}
            locale={locale}
            labels={calendarLabels}
          />
          {presets && presets.length > 0 && (
            <div className={styles.presets}>
              {presets.map((preset) => (
                <Chip
                  key={`${preset.label}-${preset.value}`}
                  size={size}
                  isSelected={preset.value === value}
                  isDisabled={isUnavailable(
                    preset.value,
                    { min: minDate, max: maxDate },
                    isDateDisabled,
                  )}
                  onSelectedChange={() => {
                    change(preset.value);
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Chip>
              ))}
            </div>
          )}
        </Popover>
      }
    />
  );
});
