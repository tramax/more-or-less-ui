import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { OptionBase } from '../_shared/types';
import { normalize, stepEnabled, useTypeahead } from '../_shared/optionNavigation';

/** The options whose label contains `query`. An empty query keeps them all. */
export function filterOptions<O extends OptionBase>(options: O[], query: string): O[] {
  const needle = normalize(query.trim());
  return needle ? options.filter((option) => normalize(option.label).includes(needle)) : options;
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
  /** Backspace with nothing typed: removes the last chip (multiple) or clears the value. */
  onBackspace: () => void;
  /** The popup, to scroll the active option into view. */
  popupRef: RefObject<HTMLElement>;
  /**
   * The caller searches: `options` are already the matches, so they aren't filtered here, and the
   * query is reported instead (`''` when it is reset).
   */
  onSearch?: (query: string) => void;
  /** Results are on their way, so the list on screen is stale and Enter doesn't take its first option. */
  isLoading?: boolean;
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
  onBackspace,
  popupRef,
  onSearch,
  isLoading = false,
}: Params<O>) {
  const [query, setQuery] = useState<string | null>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const typeahead = useTypeahead();
  // A hovered option is already in view, and scrolling it would move the list under the pointer
  const activatedByPointer = useRef(false);

  const isRemote = onSearch !== undefined;
  const visible = useMemo(
    () => (isSearchable && !isRemote && query ? filterOptions(options, query) : options),
    [options, isSearchable, isRemote, query],
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

  const show = () => {
    setActiveValue(null);
    open();
  };

  // The caller is told only when there was a query to forget
  const resetQuery = () => {
    if (query) onSearch?.('');
    setQuery(null);
  };

  const dismiss = () => {
    close();
    resetQuery();
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
      resetQuery();
      activate(option);
    } else {
      dismiss();
    }
  };

  const type = (text: string) => {
    setQuery(text);
    setActiveValue(null);
    onSearch?.(text);
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
    } else if (key === 'Enter' || (key === ' ' && !isSearchable && !typeahead.isTyping())) {
      if (!isOpen) {
        // A closed searchable input keeps Enter for the form it may sit in
        if (!isSearchable) {
          event.preventDefault();
          show();
        }
        return;
      }
      event.preventDefault();
      if (!isLoading) commit(active);
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
      if (!query) onBackspace();
    } else if (key.length === 1 && !event.altKey && !isSearchable) {
      // Type-ahead: jump to the label that starts with what was typed
      event.preventDefault();
      if (!isOpen) open();
      activate(typeahead.match(visible, activeIndex, key));
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
