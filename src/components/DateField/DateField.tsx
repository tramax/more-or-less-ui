import {
  Fragment,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { clsx } from '@/utils/clsx';
import type { ScaleProp } from '@/types/scale';
import {
  isLocalDate,
  parseLocalDate,
  today,
  warnIfNotLocal,
  type LocalDate,
} from '../_shared/dateValue';
import { TextFieldFrame } from '../_shared/TextFieldFrame';
import type { NameProps } from '../_shared/types';
import { useControlledState } from '../_shared/useControlledState';
import {
  SEGMENT_LIMITS,
  compose,
  finish,
  isImpossible,
  parsePaste,
  segmentLayout,
  segmentsFrom,
  step,
  typeDigit,
  type SegmentKind,
  type Segments,
} from './segments';
import styles from './DateField.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export { TEXT_FIELD_DEFAULTS as DATEFIELD_DEFAULTS } from '../_shared/TextFieldFrame';

/** The names of the three segments, for another language. Each is what a screen reader says on it. */
export type DateFieldLabels = {
  /** Default `Day`. */
  day?: string;
  /** Default `Month`. */
  month?: string;
  /** Default `Year`. */
  year?: string;
  /** What a screen reader says for a segment with nothing in it. Default `empty`. */
  empty?: string;
};

/** What an empty segment shows, in the field. */
export type DateFieldPlaceholders = {
  /** Default `dd`. */
  day?: string;
  /** Default `mm`. */
  month?: string;
  /** Default `yyyy`. */
  year?: string;
};

const DEFAULT_LABELS = { day: 'Day', month: 'Month', year: 'Year', empty: 'empty' } as const;
const DEFAULT_PLACEHOLDERS = { day: 'dd', month: 'mm', year: 'yyyy' } as const;

export type DateFieldOwnProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'color' | 'role' | 'children' | 'placeholder'
> & {
  size?: ScaleProp;
  /** Visible label above the field. Without it, pass `aria-label` or `aria-labelledby`. */
  label?: string;
  /**
   * Marks the field invalid and shows this message below it. The caller decides when: validate
   * when the user leaves the field, not on every keystroke.
   */
  error?: string;
  /** A hidden input submits the date under this name, as `2026-11-11`, or empty when there is none. */
  name?: string;
  /**
   * The date, a local date `'1988-03-14'` (see "Date and time values"), or `null` for none. Controlled
   * when given. A string with a zone, or a day that doesn't exist, is shown as none and logged in
   * development.
   */
  value?: LocalDate | null;
  /** The date it starts on when uncontrolled. */
  defaultValue?: LocalDate | null;
  /**
   * Called with the date once the three segments spell one, and with `null` when they stop spelling one:
   * cleared, unfinished, or a day that doesn't exist (31 February). It does not say which of those it is;
   * validate (and say so with `error`) when the user leaves the field.
   */
  onChange?: (value: LocalDate | null) => void;
  /** The order of the segments and the separators between them. Default: the browser's. */
  locale?: string;
  /** The names of the segments, for another language. */
  labels?: DateFieldLabels;
  /** What an empty segment shows (`dd`, `mm`, `yyyy`), for another language. */
  placeholders?: DateFieldPlaceholders;
  /** Not editable, not focusable, dimmed. */
  isDisabled?: boolean;
  /** Not editable, but submitted with the form. Reads as plain text: no fill, and Tab skips it. */
  isReadOnly?: boolean;
  /** An asterisk after the label and `aria-required`. */
  isRequired?: boolean;
};

export type DateFieldProps = DateFieldOwnProps & NameProps;

/**
 * What `DatePicker` adds: buttons in the field at the inline end. Not part of `DateField`'s own API;
 * it is the same field with a button in it.
 */
export type DateFieldBaseProps = DateFieldProps & { end?: ReactNode };

const validDate = (value: LocalDate | null | undefined): LocalDate | null =>
  value && isLocalDate(value) ? value : null;

/**
 * The field itself, and the buttons DatePicker puts in it (`end`). `DateField` is this without them.
 * It forwards its ref to the first segment, the one the label points at.
 */
export const DateFieldBase = forwardRef<HTMLInputElement, DateFieldBaseProps>(
  function DateFieldBase(
    {
      value: valueProp,
      defaultValue,
      onChange,
      name,
      locale,
      labels,
      placeholders,
      end,
      onFocus,
      onBlur,
      onClick,
      ...frameProps
    },
    ref,
  ) {
    const { isDisabled = false, isReadOnly = false, isRequired = false } = frameProps;
    const names = { ...DEFAULT_LABELS, ...labels };
    const hints = { ...DEFAULT_PLACEHOLDERS, ...placeholders };
    const layout = useMemo(() => segmentLayout(locale), [locale]);

    useEffect(() => {
      warnIfNotLocal('DateField', 'value', valueProp, valueProp == null || isLocalDate(valueProp));
      warnIfNotLocal(
        'DateField',
        'defaultValue',
        defaultValue,
        defaultValue == null || isLocalDate(defaultValue),
      );
    }, [valueProp, defaultValue]);

    const [current, record] = useControlledState<LocalDate | null>(
      valueProp === undefined ? undefined : validDate(valueProp),
      validDate(defaultValue),
    );

    // What is typed, which can be less than a date (a day and no year) or more (31 February). The date it
    // spells is `current` when the two agree, and when they don't, `current` was changed from outside.
    const [segments, setSegments] = useState<Segments>(() => segmentsFrom(current));
    if (compose(segments) !== current) setSegments(segmentsFrom(current));

    // The latest of both, for a handler that runs again before React has rendered the last one: a key
    // that finishes a segment moves focus, and the blur that follows must see what the key wrote
    const segmentsRef = useRef(segments);
    segmentsRef.current = segments;
    const currentRef = useRef(current);
    currentRef.current = current;

    const inputs = useRef<Partial<Record<SegmentKind, HTMLInputElement | null>>>({});
    // Whether the next digit starts the segment over: true on entering it, false while typing in it
    const isFresh = useRef(true);

    const update = (next: Segments) => {
      segmentsRef.current = next;
      setSegments(next);
      const date = compose(next);
      if (date !== currentRef.current) {
        currentRef.current = date;
        record(date);
        onChange?.(date);
      }
    };

    const focusSegment = (kind: SegmentKind | undefined) =>
      inputs.current[kind as SegmentKind]?.focus();
    const neighbour = (kind: SegmentKind, by: number) =>
      layout.order[layout.order.indexOf(kind) + by];

    const enter = (kind: SegmentKind, digit: string) => {
      const before = isFresh.current ? '' : segmentsRef.current[kind];
      const { text, done } = typeDigit(kind, before, digit);
      isFresh.current = false;
      update({ ...segmentsRef.current, [kind]: text });
      if (!done) return;
      const next = neighbour(kind, 1);
      if (next) focusSegment(next);
      else isFresh.current = true;
    };

    const onKeyDown = (kind: SegmentKind) => (event: KeyboardEvent<HTMLInputElement>) => {
      // Alt+Down is the picker's, Ctrl+V and the rest are the browser's
      if (event.altKey || event.ctrlKey || event.metaKey || isDisabled || isReadOnly) return;
      const text = segmentsRef.current[kind];

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        enter(kind, event.key);
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        if (text !== '') update({ ...segmentsRef.current, [kind]: '' });
        else if (event.key === 'Backspace') focusSegment(neighbour(kind, -1));
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const when = parseLocalDate(today()) ?? { year: 2000, month: 1, day: 1 };
        const direction = event.key === 'ArrowUp' ? 1 : -1;
        update({
          ...segmentsRef.current,
          [kind]: step(kind, segmentsRef.current, direction, when),
        });
        isFresh.current = true;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const sideways = getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
        focusSegment(neighbour(kind, event.key === 'ArrowRight' ? sideways : -sideways));
      } else if (event.key.length === 1) {
        // A segment takes digits only. A separator (`/`, `.`, `-`, space) finishes it, as it would on paper.
        event.preventDefault();
        if (text === '') return;
        update({ ...segmentsRef.current, [kind]: finish(kind, text) });
        focusSegment(neighbour(kind, 1));
      }
    };

    // What a keyboard that sends no keys does (a phone's), and autofill
    const onInput = (kind: SegmentKind) => (event: ChangeEvent<HTMLInputElement>) => {
      const digits = event.target.value.replace(/\D/g, '');
      const text = segmentsRef.current[kind];
      if (digits.length > text.length) enter(kind, digits[digits.length - 1] as string);
      else update({ ...segmentsRef.current, [kind]: digits });
    };

    const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pasted = parsePaste(event.clipboardData.getData('text'), layout.order);
      if (pasted && !isReadOnly && !isDisabled) update(pasted);
    };

    const onSegmentBlur = (kind: SegmentKind) => () => {
      // `3` was a day that could still have been `31`; leaving it makes it `03`
      const text = segmentsRef.current[kind];
      const finished = finish(kind, text);
      if (finished !== text) update({ ...segmentsRef.current, [kind]: finished });
    };

    return (
      <TextFieldFrame {...frameProps} rootClassName={styles.root} end={end}>
        {(
          {
            className,
            id,
            disabled,
            readOnly,
            tabIndex,
            'aria-invalid': invalid,
            'aria-describedby': describedBy,
          },
          rest,
          { labelId },
        ) => {
          const groupProps = rest as HTMLAttributes<HTMLDivElement>;
          const isWrong = invalid || isImpossible(segments) || undefined;
          return (
            <>
              <div
                {...groupProps}
                // A read-only field is styled by the frame's `[readonly]` rules, which a div takes as well
                {...(readOnly ? ({ readOnly: true } as object) : null)}
                role="group"
                aria-labelledby={groupProps['aria-labelledby'] ?? labelId}
                className={clsx(className, styles.box)}
                onFocus={(event: FocusEvent<HTMLDivElement>) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) onFocus?.(event);
                }}
                onBlur={(event: FocusEvent<HTMLDivElement>) => {
                  // Moving from one segment to the next is not leaving the field
                  if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.(event);
                }}
                onClick={(event: MouseEvent<HTMLDivElement>) => {
                  onClick?.(event);
                  // The padding around the segments is part of the field: a press on it enters the first one
                  if (event.target === event.currentTarget && !disabled && !readOnly) {
                    focusSegment(layout.order[0]);
                  }
                }}
              >
                {layout.order.map((kind, index) => (
                  <Fragment key={kind}>
                    {/* The cell is as wide as the placeholder or the digits, whichever is wider, and stays so */}
                    <span
                      className={styles.cell}
                      data-hint={hints[kind]}
                      data-digits={'0'.repeat(SEGMENT_LIMITS[kind].length)}
                    >
                      <input
                        ref={(node) => {
                          inputs.current[kind] = node;
                          if (index !== 0) return;
                          if (typeof ref === 'function') ref(node);
                          else if (ref) ref.current = node;
                        }}
                        // The label points at the first segment, so a press on the label enters it
                        id={index === 0 ? id : undefined}
                        className={styles.segment}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        role="spinbutton"
                        aria-label={names[kind]}
                        aria-valuemin={1}
                        aria-valuemax={SEGMENT_LIMITS[kind].max}
                        aria-valuenow={segments[kind] === '' ? undefined : Number(segments[kind])}
                        aria-valuetext={segments[kind] === '' ? names.empty : segments[kind]}
                        aria-required={isRequired || undefined}
                        aria-invalid={isWrong}
                        aria-describedby={describedBy}
                        placeholder={hints[kind]}
                        disabled={disabled}
                        readOnly={readOnly}
                        tabIndex={tabIndex}
                        value={segments[kind]}
                        onFocus={() => {
                          isFresh.current = true;
                        }}
                        onBlur={onSegmentBlur(kind)}
                        onKeyDown={onKeyDown(kind)}
                        onChange={onInput(kind)}
                        onPaste={onPaste}
                      />
                    </span>
                    {index < 2 && (
                      <span className={styles.literal} aria-hidden="true">
                        {layout.literals[index]}
                      </span>
                    )}
                  </Fragment>
                ))}
              </div>
              {name && (
                <input type="hidden" name={name} value={current ?? ''} disabled={disabled} />
              )}
            </>
          );
        }}
      </TextFieldFrame>
    );
  },
);

/**
 * A date typed into three segments (day, month, year, in the order the locale writes them): for a date
 * you know by heart, like a birthday, where a calendar is a hundred and fifty clicks back. Digits move
 * on by themselves, the arrow keys step a segment, a pasted date fills all three. Value is a
 * `LocalDate` (`'1988-03-14'`), never a `Date`. For picking from a calendar, see `DatePicker`.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  function DateField(props, ref) {
    return <DateFieldBase {...props} ref={ref} />;
  },
);
