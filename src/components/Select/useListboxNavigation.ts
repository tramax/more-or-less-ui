import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { OptionBase } from '../_shared/types';

const TYPEAHEAD_RESET_MS = 500;

// Case- and diacritic-insensitive, so "cafe" finds "Café"
const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** The options whose label contains `query`. An empty query keeps them all. */
export function filterOptions<O extends OptionBase>(options: O[], query: string): O[] {
  const needle = normalize(query.trim());
  return needle ? options.filter((option) => normalize(option.label).includes(needle)) : options;
}

/**
 * The next enabled option from `from` in `step` direction (1 or -1), not wrapping. `from` is
 * excluded; pass -1 / `options.length` to start from an end.
 */
export function stepEnabled<O extends OptionBase>(options: O[], from: number, step: 1 | -1) {
  for (let i = from + step; i >= 0 && i < options.length; i += step) {
    if (!options[i]?.isDisabled) return options[i];
  }
  return undefined;
}

/** The first enabled option, from just after `from`, wrapping, whose label starts with `text`. */
export function findByPrefix<O extends OptionBase>(options: O[], text: string, from: number) {
  const prefix = normalize(text);
  for (let n = 1; n <= options.length; n += 1) {
    const option = options[(from + n + options.length) % options.length];
    if (option && !option.isDisabled && normalize(option.label).startsWith(prefix)) return option;
  }
  return undefined;
}

interface Params<O extends OptionBase> {
  options: O[];
  /** Values of the selected options. */
  selected: string[];
  isMultiple: boolean;
  isSearchable: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Selects the option (single) or toggles it (multiple). */
  choose: (value: string) => void;
  /** Removes the last selected option that can be removed (multiple). */
  removeLast: () => void;
  /** The popup, to scroll the active option into view. */
  popupRef: RefObject<HTMLElement>;
}

/**
 * The active option, the search query and the keyboard model of the Select's listbox, following the
 * WAI-ARIA APG combobox pattern: select-only when not searchable, editable with a list when
 * searchable. DOM focus stays on the combobox element; the active option is announced through
 * `aria-activedescendant`.
 *
 * `query` is `null` while the user isn't typing, so a single searchable input can show the selected
 * label then.
 */
export function useListboxNavigation<O extends OptionBase>({
  options,
  selected,
  isMultiple,
  isSearchable,
  isOpen,
  open,
  close,
  choose,
  removeLast,
  popupRef,
}: Params<O>) {
  const [query, setQuery] = useState<string | null>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const typeahead = useRef({ text: '', timer: 0 });
  // A hovered option is already in view, and scrolling it would move the list under the pointer
  const activatedByPointer = useRef(false);

  const visible = useMemo(
    () => (isSearchable && query ? filterOptions(options, query) : options),
    [options, isSearchable, query],
  );

  // Where the active option starts: the first match while searching, else the selection
  const enabled = visible.filter((option) => !option.isDisabled);
  const fallback = query
    ? enabled[0]
    : (enabled.find((option) => selected.includes(option.value)) ?? enabled[0]);
  const active = visible.find((o) => o.value === activeValue && !o.isDisabled) ?? fallback;
  const activeIndex = active ? visible.indexOf(active) : -1;

  useEffect(() => {
    if (!isOpen || activatedByPointer.current) return;
    popupRef.current?.querySelector('[data-active]')?.scrollIntoView?.({ block: 'nearest' });
  }, [isOpen, active?.value, popupRef]);

  useEffect(() => () => window.clearTimeout(typeahead.current.timer), []);

  const show = () => {
    setActiveValue(null);
    open();
  };

  const dismiss = () => {
    close();
    setQuery(null);
    setActiveValue(null);
  };

  const activate = (option: O | undefined, byPointer = false) => {
    activatedByPointer.current = byPointer;
    if (option) setActiveValue(option.value);
  };

  const commit = (option: O | undefined) => {
    if (!option || option.isDisabled) return;
    choose(option.value);
    if (isMultiple) {
      // Stays open for the next pick, with the list whole again
      setQuery(null);
      activate(option);
    } else {
      dismiss();
    }
  };

  const type = (text: string) => {
    setQuery(text);
    setActiveValue(null);
    if (!isOpen) open();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const { key } = event;
    if (event.ctrlKey || event.metaKey) return;

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) return show();
      activate(
        activeIndex === -1
          ? enabled[key === 'ArrowDown' ? 0 : enabled.length - 1]
          : stepEnabled(visible, activeIndex, key === 'ArrowDown' ? 1 : -1),
      );
    } else if ((key === 'Home' || key === 'End') && !isSearchable) {
      // A searchable input keeps Home / End for its caret
      event.preventDefault();
      if (!isOpen) open();
      activate(key === 'Home' ? enabled[0] : enabled[enabled.length - 1]);
    } else if (key === 'Enter' || (key === ' ' && !isSearchable && !typeahead.current.text)) {
      if (!isOpen) {
        // A closed searchable input keeps Enter for the form it may sit in
        if (!isSearchable) {
          event.preventDefault();
          show();
        }
        return;
      }
      event.preventDefault();
      commit(active);
    } else if (key === 'Escape') {
      if (!isOpen) return;
      event.preventDefault();
      dismiss();
    } else if (key === 'Tab') {
      // Select-only (APG): Tab takes the active option along. Not for a multiple, which a
      // keyboard user may tab through without picking, and not for an input, which has typed text.
      if (isOpen && !isSearchable && !isMultiple) commit(active);
      else if (isOpen) dismiss();
    } else if (key === 'Backspace') {
      if (isMultiple && !query) removeLast();
    } else if (key.length === 1 && !event.altKey && !isSearchable) {
      // Type-ahead: jump to the label that starts with what was typed
      event.preventDefault();
      const state = typeahead.current;
      window.clearTimeout(state.timer);
      state.text += key;
      state.timer = window.setTimeout(() => {
        state.text = '';
      }, TYPEAHEAD_RESET_MS);
      if (!isOpen) open();
      // A first letter moves on from the current option; more letters refine from it
      const from = state.text.length === 1 ? activeIndex : Math.max(activeIndex - 1, -1);
      activate(findByPrefix(visible, state.text, from));
    }
  };

  return {
    query,
    visible,
    active,
    show,
    dismiss,
    type,
    commit,
    activate,
    onKeyDown,
  };
}
