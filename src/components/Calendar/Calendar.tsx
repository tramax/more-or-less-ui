import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import {
  daysInMonth,
  formatLocalDate,
  isLocalDate,
  parseLocalDate,
  parseLocalMonth,
  today as todayIn,
  warnIfNotLocal,
  type LocalDate,
  type LocalMonth,
} from '../_shared/dateValue';
import { ChevronIcon } from '../_shared/ChevronIcon';
import { IconButton } from '../_shared/IconButton';
import round from '../_shared/RoundControl.module.css';
import sizes from '../_shared/Size.module.css';
import { StrokeIcon } from '../_shared/StrokeIcon';
import { useControlledState } from '../_shared/useControlledState';
import {
  addMonths,
  addYears,
  clampDate,
  endOfMonth,
  isUnavailable,
  startOfMonth,
  yearPageStart,
  type Weekday,
} from './calendarMath';
import { defaultFirstDay, makeFormats, monthOf } from './calendarFormats';
import { ChoiceGrid, type Choice } from './ChoiceGrid';
import { DayGrid } from './DayGrid';
import styles from './Calendar.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const CALENDAR_DEFAULTS = {
  size: 'normal',
} as const;

// `size` sets font-size only: the cells and the gaps are in em, so they follow it, escape-hatch values
// included. Its classes are _shared/Size.module.css, since `size` is the only scale prop.
const SCALE_SPEC = {
  direct: [],
  compound: { size: ['fontSize'] },
  defaults: CALENDAR_DEFAULTS,
} as const;

/** What the calendar is showing: the days of a month, the months of a year, or a page of years. */
export type CalendarView = 'days' | 'months' | 'years';

export type CalendarLabels = {
  /** The previous button's name for the view it is in. Default `Previous month`, `Previous year`, `Previous years`. */
  previous?: (view: CalendarView) => string;
  /** The next button's name. Default `Next month`, `Next year`, `Next years`. */
  next?: (view: CalendarView) => string;
};

const DEFAULT_LABELS = {
  previous: (view) =>
    ({ days: 'Previous month', months: 'Previous year', years: 'Previous years' })[view],
  next: (view) => ({ days: 'Next month', months: 'Next year', years: 'Next years' })[view],
} satisfies Required<CalendarLabels>;

export type CalendarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'color' | 'children' | 'defaultValue'
> & {
  /** Sets the font size; the cells and the gaps follow it. `1em` takes the surrounding text's size. */
  size?: ScaleProp;
  /**
   * The chosen date, a local date `'2026-11-11'` (see "Date and time values"), or `null` for none.
   * Controlled when given. A string with a zone, or a day that doesn't exist, is shown as none and
   * logged in development.
   */
  value?: LocalDate | null;
  /** The date it starts on when uncontrolled. */
  defaultValue?: LocalDate | null;
  /** Called with the date that was pressed, also when it is the chosen one again. */
  onChange?: (value: LocalDate) => void;
  /** The earliest date that can be chosen. */
  min?: LocalDate;
  /** The latest date that can be chosen. */
  max?: LocalDate;
  /** Dates that can't be chosen (a day off, a booked day). They stay reachable by keyboard, dimmed. */
  isDateDisabled?: (date: LocalDate) => boolean;
  /** Nothing can be pressed. */
  isDisabled?: boolean;
  /**
   * The month shown, `'2026-11'`. Controlled when given: the parent owns it (a range picker shows
   * two). Without it the calendar follows the date the keyboard is on, and starts on `defaultValue`'s,
   * or `value`'s, or this month.
   */
  visibleMonth?: LocalMonth;
  /** The month it starts on when `visibleMonth` is not given. */
  defaultVisibleMonth?: LocalMonth;
  /** Called when the month shown changes (the buttons, the keyboard, the month and year grids). */
  onVisibleMonthChange?: (month: LocalMonth) => void;
  /** The first column, 0 for Sunday to 6. Default: the locale's, or Monday where the browser can't say. */
  firstDayOfWeek?: Weekday;
  /** For the names of the months and days. Default: the browser's. */
  locale?: string;
  /** The names of the previous and next buttons, for another language. */
  labels?: CalendarLabels;
  /** Names the group. Default `Calendar`; `aria-labelledby` replaces it. */
  'aria-label'?: string;
};

const validDate = (value: LocalDate | null | undefined): LocalDate | null =>
  value && isLocalDate(value) ? value : null;

/** The same day of the month in another month, or its last day if that month is shorter. */
function dayInMonth(month: LocalMonth, day: number): LocalDate {
  const parsed = parseLocalMonth(month);
  if (!parsed) throw new RangeError(`${JSON.stringify(month)} is not a local month`);
  return formatLocalDate({ ...parsed, day: Math.min(day, daysInMonth(parsed.year, parsed.month)) });
}

const dayOf = (date: LocalDate) => parseLocalDate(date)?.day ?? 1;
const yearOf = (date: LocalDate) => parseLocalDate(date)?.year ?? 1;

const PreviousIcon = ({ className }: { className: string | undefined }) => (
  // The span is what flips in a right-to-left layout; the icon's own scale is the button's
  <span className={styles.arrow}>
    <StrokeIcon className={className}>
      <path d="M10 4l-4 4 4 4" />
    </StrokeIcon>
  </span>
);
const NextIcon = ({ className }: { className: string | undefined }) => (
  <span className={styles.arrow}>
    <StrokeIcon className={className}>
      <path d="M6 4l4 4-4 4" />
    </StrokeIcon>
  </span>
);

/**
 * A month of days to choose one from, drawn in place (a page, a Popover): the part of DatePicker that is
 * a grid. It holds a date, not a field; `DateField` is the one to type.
 *
 * The header name opens a grid of months, and its year a grid of years, so a birthday decades back is
 * three presses and not a hundred and fifty. The month is the keyboard's: the arrow keys walk the dates
 * and turn the page at its edge (APG's date picker grid; see `DayGrid`).
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    size,
    value: valueProp,
    defaultValue,
    onChange,
    min,
    max,
    isDateDisabled,
    isDisabled = false,
    visibleMonth: visibleMonthProp,
    defaultVisibleMonth,
    onVisibleMonthChange,
    firstDayOfWeek,
    locale,
    labels,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    className,
    style,
    ...props
  },
  ref,
) {
  const {
    classNames,
    style: scaleStyle,
    rest,
  } = resolveScaleProps(sizes, SCALE_SPEC, { ...props, size });

  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);
  const titleId = useId();

  useEffect(() => {
    warnIfNotLocal('Calendar', 'value', valueProp, valueProp == null || isLocalDate(valueProp));
    warnIfNotLocal(
      'Calendar',
      'defaultValue',
      defaultValue,
      defaultValue == null || isLocalDate(defaultValue),
    );
    warnIfNotLocal('Calendar', 'min', min, min === undefined || isLocalDate(min));
    warnIfNotLocal('Calendar', 'max', max, max === undefined || isLocalDate(max));
  }, [valueProp, defaultValue, min, max]);

  const minDate = validDate(min) ?? undefined;
  const maxDate = validDate(max) ?? undefined;
  const controlledMonth =
    visibleMonthProp && parseLocalMonth(visibleMonthProp) ? visibleMonthProp : undefined;

  const [selected, record] = useControlledState<LocalDate | null>(
    valueProp === undefined ? undefined : validDate(valueProp),
    validDate(defaultValue),
  );

  const today = todayIn();
  // The date the keyboard is on, which is also the month shown unless the parent owns the month
  const [focusedState, setFocusedState] = useState<LocalDate>(() => {
    const month = parseLocalMonth(defaultVisibleMonth ?? controlledMonth)
      ? (defaultVisibleMonth ?? controlledMonth)
      : undefined;
    const candidates = [selected, today];
    const start = month
      ? (candidates.find((date) => date && monthOf(date) === month) ?? (`${month}-01` as LocalDate))
      : (selected ?? today);
    return clampDate(start as LocalDate, minDate, maxDate);
  });

  // A chosen date set from outside (a field next to the calendar) brings the calendar to it
  const [seenSelected, setSeenSelected] = useState(selected);
  if (selected !== seenSelected) {
    setSeenSelected(selected);
    if (selected && !controlledMonth) setFocusedState(selected);
  }

  const month = controlledMonth ?? monthOf(focusedState);
  // A month the parent moved to: the same day of it, so the keyboard has somewhere to be
  const focused =
    monthOf(focusedState) === month ? focusedState : dayInMonth(month, dayOf(focusedState));

  const [view, setView] = useState<CalendarView>('days');
  // Where the keyboard is in the month and year grids, which browse without moving the month shown
  const [cursor, setCursor] = useState<LocalDate>(focused);

  // Focus follows a key or a change of view, but not a press of the previous / next button
  const pendingFocus = useRef(false);
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    rootRef.current?.querySelector<HTMLElement>('[data-cell][tabindex="0"]')?.focus();
  });

  const formats = useMemo(() => makeFormats(locale), [locale]);
  const firstDay = firstDayOfWeek ?? defaultFirstDay(locale);
  const { previous, next } = { ...DEFAULT_LABELS, ...labels };

  const unavailable = (date: LocalDate) =>
    isUnavailable(date, { min: minDate, max: maxDate }, isDateDisabled);

  const goTo = (date: LocalDate, hasFocus: boolean) => {
    const target = clampDate(date, minDate, maxDate);
    if (hasFocus) pendingFocus.current = true;
    setFocusedState(target);
    if (monthOf(target) !== month) onVisibleMonthChange?.(monthOf(target));
  };

  const pick = (date: LocalDate) => {
    record(date);
    onChange?.(date);
    goTo(date, true);
  };

  const showView = (next: CalendarView) => {
    pendingFocus.current = true;
    setView(next);
  };

  // --- the header ---

  const cursorYear = yearOf(cursor);
  const pageStart = yearPageStart(cursorYear);
  const yearStart = (year: number) => formatLocalDate({ year, month: 1, day: 1 });
  const yearEnd = (year: number) => formatLocalDate({ year, month: 12, day: 31 });

  const canGo = (direction: -1 | 1) => {
    if (isDisabled) return false;
    if (view === 'days') {
      const target = addMonths(focused, direction);
      return direction < 0
        ? minDate === undefined || endOfMonth(target) >= minDate
        : maxDate === undefined || startOfMonth(target) <= maxDate;
    }
    // The year before the first, or after the last, that a date can name
    const [before, after] =
      view === 'months' ? [cursorYear - 1, cursorYear + 1] : [pageStart - 1, pageStart + 12];
    const year = direction < 0 ? before : after;
    if (year < 1 || year > 9999) return false;
    return direction < 0
      ? minDate === undefined || yearEnd(year) >= minDate
      : maxDate === undefined || yearStart(year) <= maxDate;
  };

  const go = (direction: -1 | 1) => {
    if (view === 'days') goTo(addMonths(focused, direction), false);
    else setCursor(addYears(cursor, direction * (view === 'months' ? 1 : 12)));
  };

  const titleText =
    view === 'days'
      ? formats.monthYear(focused)
      : view === 'months'
        ? formats.year(cursor)
        : `${formats.year(yearStart(pageStart))} – ${formats.year(yearStart(pageStart + 11))}`;

  const openTitle = () => {
    if (view === 'days') setCursor(focused);
    showView(view === 'days' ? 'months' : 'years');
  };

  // --- the month and year grids ---

  const monthChoices = (): Choice[] =>
    Array.from({ length: 12 }, (_, index) => {
      const date = formatLocalDate({ year: cursorYear, month: index + 1, day: 1 });
      return {
        key: monthOf(date),
        text: formats.monthShort(date),
        label: formats.monthYear(date),
        isCurrent: monthOf(date) === month,
        isCursor: monthOf(date) === monthOf(cursor),
        isUnavailable:
          (minDate !== undefined && endOfMonth(date) < minDate) ||
          (maxDate !== undefined && date > maxDate),
      };
    });

  const yearChoices = (): Choice[] =>
    Array.from({ length: 12 }, (_, index) => {
      const year = pageStart + index;
      const date = yearStart(year);
      return {
        key: String(year),
        text: formats.year(date),
        label: formats.year(date),
        isCurrent: year === yearOf(focused),
        isCursor: year === cursorYear,
        isUnavailable:
          (minDate !== undefined && yearEnd(year) < minDate) ||
          (maxDate !== undefined && date > maxDate),
      };
    });

  const pickChoice = (key: string) => {
    if (view === 'months') {
      goTo(dayInMonth(key as LocalMonth, dayOf(focused)), true);
      setView('days');
    } else {
      setCursor(
        dayInMonth(
          `${key.padStart(4, '0')}-${monthOf(cursor).slice(5)}` as LocalMonth,
          dayOf(cursor),
        ),
      );
      showView('months');
    }
  };

  const handleChoiceKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const move = view === 'months' ? addMonths : addYears;
    const sideways = getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
    const first = view === 'months' ? yearStart(cursorYear) : yearStart(pageStart);
    const target: LocalDate | undefined = {
      ArrowLeft: move(cursor, -sideways),
      ArrowRight: move(cursor, sideways),
      ArrowUp: move(cursor, -3),
      ArrowDown: move(cursor, 3),
      PageUp: move(cursor, -12),
      PageDown: move(cursor, 12),
      Home: first,
      End: move(first, 11),
    }[event.key];

    if (target) {
      event.preventDefault();
      pendingFocus.current = true;
      setCursor(target);
    } else if (event.key === 'Escape') {
      // One step back, and the Escape is spent: a Popover around the calendar stays open
      event.preventDefault();
      event.stopPropagation();
      showView(view === 'years' ? 'months' : 'days');
    }
  };

  const hasTitleButton = view !== 'years';

  return (
    <div
      {...rest}
      ref={rootRef}
      role="group"
      aria-label={ariaLabel ?? (labelledBy ? undefined : 'Calendar')}
      aria-labelledby={labelledBy}
      className={clsx(styles.root, classNames, className)}
      style={{ ...scaleStyle, ...style }}
    >
      <div className={styles.header}>
        <IconButton
          label={previous(view)}
          icon={PreviousIcon}
          onClick={() => go(-1)}
          isDisabled={!canGo(-1)}
          className={styles.nav}
        />
        {/* Read out when it changes, so turning the page says which month it turned to */}
        <div className={styles.titleSlot} aria-live="polite">
          {hasTitleButton ? (
            <button
              type="button"
              id={titleId}
              disabled={isDisabled}
              className={clsx(round.control, styles.title)}
              onClick={openTitle}
            >
              {titleText}
              {/* Without it the name reads as a heading, and nothing says it opens the months */}
              <ChevronIcon className={styles.titleChevron} />
            </button>
          ) : (
            <span id={titleId} className={clsx(styles.title, styles.titleStatic)}>
              {titleText}
            </span>
          )}
        </div>
        <IconButton
          label={next(view)}
          icon={NextIcon}
          onClick={() => go(1)}
          isDisabled={!canGo(1)}
          className={styles.nav}
        />
      </div>

      {view === 'days' ? (
        <DayGrid
          month={focused}
          focused={focused}
          selected={selected}
          today={today}
          firstDay={firstDay}
          formats={formats.days}
          labelledBy={titleId}
          isDisabled={isDisabled}
          isUnavailable={unavailable}
          onPick={pick}
          onMove={(date) => goTo(date, true)}
        />
      ) : (
        <ChoiceGrid
          choices={view === 'months' ? monthChoices() : yearChoices()}
          labelledBy={titleId}
          isDisabled={isDisabled}
          onPick={pickChoice}
          onKeyDown={handleChoiceKeyDown}
        />
      )}
    </div>
  );
});
