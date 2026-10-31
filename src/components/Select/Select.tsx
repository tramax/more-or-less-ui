import {
  forwardRef,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ForwardedRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { clsx } from '@/utils/clsx';
import type { ScaleProp } from '@/types/scale';
import { TextFieldFrame } from '../_shared/TextFieldFrame';
import { OptionIcon } from '../_shared/OptionIcon';
import { OptionText } from '../_shared/OptionText';
import { Spinner } from '../_shared/Spinner';
import type { NameProps, OptionBase } from '../_shared/types';
import { CrossIcon } from '../_shared/CrossIcon';
import { Chip } from '../Chip';
import { useListboxNavigation } from './useListboxNavigation';
import { useSelectPopup } from './useSelectPopup';
import styles from './Select.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export { TEXT_FIELD_DEFAULTS as SELECT_DEFAULTS } from '../_shared/TextFieldFrame';

export type SelectOption = OptionBase & {
  /**
   * A flag, an avatar, a logo: shown before the text, in the list, the field and on a chip.
   * Decorative, so it is hidden from assistive tech and `label` stays the name. It fills a 1.25em
   * square (`--option-icon-size`), so pass an `<img>`, an `<svg>` or an emoji and let it be sized by
   * that.
   */
  icon?: ReactNode;
};

type SelectFieldProps = Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'defaultValue' | 'color' | 'role' | 'children' | 'placeholder'
> & {
  options: SelectOption[];
  /** A hidden input submits the value under this name; one per value when `isMultiple`. */
  name?: string;
  size?: ScaleProp;
  /** Visible label above the field. Without it, pass `aria-label` or `aria-labelledby`. */
  label?: string;
  /**
   * Marks the field invalid and shows this message below it. The caller decides when: validate
   * when the user leaves the field, not on every keystroke.
   */
  error?: string;
  /** Shown while nothing is selected. Not a label or a hint: use `label`. */
  placeholder?: string;
  /**
   * A spinner replaces the chevron. An empty list says "Loading…" instead of "No results"; one that
   * isn't empty stays on screen, marked busy, and Enter doesn't take its first option. Set it while
   * a search is running.
   */
  isLoading?: boolean;
  /** Not openable, not focusable, dimmed. */
  isDisabled?: boolean;
  /**
   * An asterisk after the label and `aria-required`. Not native `required`: there is no native
   * control behind the field, so a form's own validation doesn't see it.
   */
  isRequired?: boolean;
};

// `onSearch` is search, so it can't be combined with `isSearchable={false}`
type SearchProps =
  | {
      /**
       * The control is an input that filters the options as the user types. The value is still always
       * one of the options, never the typed text.
       */
      isSearchable?: boolean;
      onSearch?: undefined;
    }
  | {
      isSearchable?: true;
      /**
       * The caller searches, for options fetched by what is typed. Makes the Select searchable and
       * stops it filtering `options`: pass the matches. Called with the typed text, and with `''`
       * when the text is reset (a pick in a multiple one, the list closing). Debounce and abort in
       * the caller. Selected options are remembered, so they stay shown when new results replace the
       * list; a value that is already selected on first render needs its option in `options` once.
       * Values are in the order they were picked, not `options` order.
       */
      onSearch: (query: string) => void;
    };

export type SelectProps = SelectFieldProps &
  SearchProps &
  NameProps &
  (
    | {
        isMultiple?: false;
        isClearable?: false;
        /** Selected value (controlled). `null` is controlled with nothing selected. */
        value?: string | null;
        /** Selected value at the start (uncontrolled). Nothing is selected without it. */
        defaultValue?: string;
        /** Called with the newly selected value. The user can't clear it unless `isClearable`. */
        onChange?: (value: string) => void;
      }
    | {
        isMultiple?: false;
        /**
         * A button clears the value (Backspace does too, when not searchable; clearing the text of a
         * searchable one does). Not shown while `isRequired` or `isDisabled`, or when the selected
         * option is disabled.
         */
        isClearable: true;
        value?: string | null;
        defaultValue?: string;
        /** Called with the newly selected value, or `null` when the user clears it. */
        onChange?: (value: string | null) => void;
      }
    | {
        /** Pick any number of options, shown as chips. The popup stays open between picks. */
        isMultiple: true;
        /**
         * A button removes every chip that can be removed at once. Not shown while `isRequired` or
         * `isDisabled`.
         */
        isClearable?: boolean;
        /** Selected values (controlled). */
        value?: string[];
        /** Selected values at the start (uncontrolled). */
        defaultValue?: string[];
        /** Called with the selected values in `options` order, not click order. */
        onChange?: (value: string[]) => void;
      }
  );

// What the component works with once `isMultiple` has been looked at. The public type above is the
// union that makes `value` and `onChange` follow `isMultiple`.
type SelectImplProps = SelectFieldProps & {
  isSearchable?: boolean;
  onSearch?: (query: string) => void;
  isMultiple?: boolean;
  isClearable?: boolean;
  value?: string | string[] | null;
  defaultValue?: string | string[];
  onChange?: (value: string | string[] | null) => void;
};

const toValues = (value: string | string[] | null | undefined): string[] =>
  value == null ? [] : typeof value === 'string' ? [value] : value;

function assignRef<T>(ref: ForwardedRef<T>, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

const Chevron = () => (
  <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M4 6l4 4 4-4" />
  </svg>
);

const Tick = ({ className }: { className: string | undefined }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

export const Select = forwardRef<HTMLElement, SelectProps>(function Select(rawProps, ref) {
  const {
    options,
    value,
    defaultValue,
    onChange,
    name,
    placeholder,
    isSearchable: searchableProp = false,
    onSearch,
    isLoading = false,
    isMultiple = false,
    isClearable = false,
    isDisabled = false,
    isRequired = false,
    id,
    ...frameProps
  } = rawProps as SelectImplProps;
  const isRemote = onSearch !== undefined;
  const isSearchable = searchableProp || isRemote;

  const autoId = useId();
  const controlId = id ?? autoId;
  const listboxId = `${controlId}-listbox`;
  const optionId = (option: SelectOption) => `${controlId}-option-${options.indexOf(option)}`;
  // `useId()` returns ":r1:", which isn't valid in a CSS dashed-ident
  const anchorName = `--select-${controlId.replace(/[^\w-]/g, '')}`;

  // One list for both modes: a single Select holds at most one. Only values that are options count.
  const [uncontrolled, setUncontrolled] = useState(() => toValues(defaultValue));
  const current = value === undefined ? uncontrolled : toValues(value);
  // With `onSearch`, `options` are only the latest matches, so a selected option that dropped out of
  // them is looked up here, in the order the values were picked. Without it, `options` is the whole
  // list, in its order.
  const remembered = useRef(new Map<string, SelectOption>());
  let selectedOptions: SelectOption[];
  if (isRemote) {
    const inList = new Map(options.map((option) => [option.value, option]));
    selectedOptions = current.flatMap((v) => {
      const option = inList.get(v) ?? remembered.current.get(v);
      if (option) remembered.current.set(v, option);
      return option ? [option] : [];
    });
  } else {
    selectedOptions = options.filter((option) => current.includes(option.value));
  }
  const selectedValues = selectedOptions.map((option) => option.value);
  const selectedLabel = selectedOptions[0]?.label ?? '';
  // Only a single Select shows the selected option's icon in the field; a multiple one's are on its chips
  const selectedIcon = isMultiple ? undefined : selectedOptions[0]?.icon;
  const hasSelectedIcon = selectedIcon != null && selectedIcon !== false;

  const update = (next: string[]) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(isMultiple ? next : (next[0] ?? null));
  };
  const choose = (optionValue: string) => {
    // The caller may swap the list in the same update as the pick, before it is rendered selected
    const picked = options.find((o) => o.value === optionValue);
    if (isRemote && picked) remembered.current.set(optionValue, picked);
    if (!isMultiple) {
      if (selectedValues[0] !== optionValue) update([optionValue]);
      return;
    }
    if (isRemote) {
      update(
        selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue],
      );
      return;
    }
    // In `options` order, not click order
    update(
      options
        .filter((o) =>
          o.value === optionValue ? !current.includes(optionValue) : current.includes(o.value),
        )
        .map((o) => o.value),
    );
  };
  const remove = (optionValue: string) => update(selectedValues.filter((v) => v !== optionValue));
  const removeLast = () => {
    const last = [...selectedOptions].reverse().find((option) => !option.isDisabled);
    if (last) remove(last.value);
  };
  // The field keeps room for the button whenever it could appear, so the text doesn't shift when a
  // value is picked. The button itself shows only while there is something to clear.
  const canClear = isClearable && !isRequired;
  const clearable = canClear && !isDisabled && selectedOptions.some((option) => !option.isDisabled);
  // A disabled option can't be removed, so it stays, as it does for Backspace
  const clear = () => {
    if (clearable) update(selectedOptions.filter((o) => o.isDisabled).map((o) => o.value));
  };
  const onBackspace = () => {
    if (isMultiple) removeLast();
    // A searchable input's Backspace edits its text
    else if (!isSearchable) clear();
  };

  const popup = useSelectPopup();
  const { isOpen } = popup;
  const nav = useListboxNavigation({
    options,
    selected: selectedValues,
    isMultiple,
    isSearchable,
    isOpen,
    open: popup.open,
    close: popup.close,
    choose,
    onBackspace,
    popupRef: popup.popupRef,
    onSearch,
    isLoading,
  });

  // While the popup animates out, keep listing what it listed: closing resets the query, which
  // would otherwise make a filtered list grow back as it fades
  const lastVisible = useRef(nav.visible);
  if (isOpen) lastVisible.current = nav.visible;
  const listed = isOpen ? nav.visible : lastVisible.current;

  const comboRef = useRef<HTMLElement | null>(null);
  const setComboRef = (node: HTMLElement | null) => {
    comboRef.current = node;
    assignRef(ref, node);
  };

  return (
    <TextFieldFrame
      {...frameProps}
      id={controlId}
      isDisabled={isDisabled}
      isRequired={isRequired}
      rootClassName={styles.root}
    >
      {(
        {
          className,
          id: comboId,
          disabled,
          'aria-invalid': invalid,
          'aria-describedby': describedBy,
        },
        rest,
      ) => {
        // The frame hands over text-field props (readOnly, required, tabIndex) that don't apply
        const controlProps = rest as HTMLAttributes<HTMLElement>;
        const combobox = {
          ...rest,
          id: comboId,
          role: 'combobox',
          disabled,
          'aria-expanded': isOpen,
          'aria-haspopup': 'listbox',
          'aria-controls': isOpen && nav.visible.length > 0 ? listboxId : undefined,
          'aria-activedescendant': isOpen && nav.active ? optionId(nav.active) : undefined,
          'aria-autocomplete': isSearchable ? 'list' : undefined,
          'aria-required': isRequired || undefined,
          'aria-invalid': invalid,
          'aria-describedby': describedBy,
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            controlProps.onKeyDown?.(event);
            if (!event.defaultPrevented) nav.onKeyDown(event);
          },
          onBlur: (event: FocusEvent<HTMLElement>) => {
            controlProps.onBlur?.(event);
            nav.dismiss();
          },
        } as const;

        const inputProps = {
          ...combobox,
          ref: setComboRef,
          type: 'text',
          autoComplete: 'off',
          spellCheck: false,
        } as const;

        const showInputIcon = isSearchable && hasSelectedIcon && nav.query == null;

        const toggle = () => (isOpen ? nav.dismiss() : nav.show());

        let control;
        if (isMultiple) {
          control = (
            <div
              className={clsx(className, styles.box)}
              onMouseDown={(event: MouseEvent) => {
                // Anywhere in the box but the input itself focuses the input without blurring it
                if (event.target !== comboRef.current) {
                  event.preventDefault();
                  comboRef.current?.focus();
                }
              }}
              onClick={(event: MouseEvent) => {
                // A removable chip handled this click (and marked it so)
                if (event.defaultPrevented) return;
                if (!isSearchable) toggle();
                else if (!isOpen) nav.show();
              }}
            >
              {selectedOptions.map((option) => (
                <Chip
                  key={option.value}
                  // The field's own size, not a size of the chip's
                  size="1em"
                  isInField
                  icon={option.icon}
                  onRemove={
                    disabled || option.isDisabled
                      ? undefined
                      : () => {
                          remove(option.value);
                          comboRef.current?.focus();
                        }
                  }
                >
                  {option.label}
                </Chip>
              ))}
              <input
                {...inputProps}
                className={clsx(styles.bare, !isSearchable && styles.readOnly)}
                value={nav.query ?? ''}
                readOnly={!isSearchable}
                inputMode={isSearchable ? undefined : 'none'}
                placeholder={selectedOptions.length ? undefined : placeholder}
                onChange={(event) => nav.type(event.target.value)}
              />
            </div>
          );
        } else if (isSearchable) {
          control = (
            <input
              {...inputProps}
              className={clsx(className, styles.input)}
              value={nav.query ?? selectedLabel}
              placeholder={placeholder}
              onChange={(event) => {
                nav.type(event.target.value);
                // Emptying the text clears the value, the keyboard route to the clear button
                if (!event.target.value) clear();
              }}
              onClick={(event) => {
                rawProps.onClick?.(event);
                if (!isOpen) nav.show();
              }}
            />
          );
        } else {
          control = (
            <button
              {...combobox}
              ref={setComboRef}
              type="button"
              className={clsx(className, styles.input, styles.trigger)}
              onClick={(event) => {
                rawProps.onClick?.(event);
                if (event.defaultPrevented) return;
                // Safari doesn't focus a button on click, and the blur handler needs the focus
                event.currentTarget.focus();
                toggle();
              }}
              // Space activates a button on keyup; keydown already handled it
              onKeyUp={(event) => {
                rawProps.onKeyUp?.(event);
                if (event.key === ' ') event.preventDefault();
              }}
            >
              {hasSelectedIcon && <OptionIcon>{selectedIcon}</OptionIcon>}
              <span
                className={clsx(styles.triggerText, !selectedOptions.length && styles.placeholder)}
              >
                {/* A non-breaking space keeps the field's height when there is no text */}
                {selectedLabel || placeholder || ' '}
              </span>
            </button>
          );
        }

        return (
          <div
            className={styles.field}
            data-open={isOpen || undefined}
            data-clearable={canClear || undefined}
            data-loading={isLoading || undefined}
            data-has-icon={showInputIcon || undefined}
            style={{ '--select-anchor': anchorName } as CSSProperties}
          >
            {control}
            {/* Over the input, which can't hold it. Gone while the user types (and the room for it
                with it): the text no longer says what is selected. */}
            {showInputIcon && (
              <span className={styles.inputIcon}>
                <OptionIcon>{selectedIcon}</OptionIcon>
              </span>
            )}
            {clearable && (
              // Out of the tab order like a chip's: the keyboard clears with Backspace. mousedown is
              // cancelled so the control keeps focus.
              <button
                type="button"
                tabIndex={-1}
                className={styles.clear}
                aria-label="Clear"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  clear();
                  comboRef.current?.focus();
                }}
              >
                <CrossIcon className={styles.clearIcon} />
              </button>
            )}
            <Chevron />
            {isLoading && <Spinner className={styles.spinner} />}
            {name &&
              selectedValues.map((v) => (
                <input key={v} type="hidden" name={name} value={v} disabled={disabled} />
              ))}
            {popup.isPresent && (
              <div
                ref={popup.popupRef}
                // `manual`: we close it ourselves, so focus never leaves the control
                {...{ popover: 'manual' }}
                className={styles.popup}
                data-state={isOpen ? 'open' : 'closed'}
                // Leaving: still on screen for its exit animation, but no longer there for anyone else
                aria-hidden={!isOpen || undefined}
                // Keeps focus on the control: a click in the popup isn't a blur
                onMouseDown={(event) => event.preventDefault()}
              >
                {listed.length === 0 ? (
                  <p role="status" className={styles.empty}>
                    {isLoading ? 'Loading…' : 'No results'}
                  </p>
                ) : (
                  <ul
                    id={listboxId}
                    role="listbox"
                    className={styles.listbox}
                    aria-multiselectable={isMultiple || undefined}
                    aria-busy={isLoading || undefined}
                    aria-label={rawProps['aria-label'] ?? frameProps.label}
                    aria-labelledby={rawProps['aria-labelledby']}
                  >
                    {listed.map((option) => {
                      const isSelected = selectedValues.includes(option.value);
                      const descriptionId = option.description
                        ? `${optionId(option)}-description`
                        : undefined;
                      return (
                        <li
                          key={option.value}
                          id={optionId(option)}
                          role="option"
                          className={styles.option}
                          aria-selected={isSelected}
                          aria-disabled={option.isDisabled || undefined}
                          aria-describedby={descriptionId}
                          data-active={(isOpen && option === nav.active) || undefined}
                          onClick={() => nav.commit(option)}
                          onMouseMove={() => {
                            if (option !== nav.active && !option.isDisabled)
                              nav.activate(option, true);
                          }}
                        >
                          {isMultiple && (
                            <span className={styles.checkbox} aria-hidden="true">
                              <Tick className={styles.checkboxTick} />
                            </span>
                          )}
                          <span className={styles.optionText}>
                            <OptionText
                              label={option.label}
                              description={option.description}
                              descriptionId={descriptionId}
                              icon={option.icon}
                            />
                          </span>
                          {!isMultiple && isSelected && <Tick className={styles.tick} />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      }}
    </TextFieldFrame>
  );
});
