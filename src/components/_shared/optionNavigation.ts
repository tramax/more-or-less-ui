import { useEffect, useRef } from 'react';
import type { OptionBase } from './types';

const TYPEAHEAD_RESET_MS = 500;

/** Case- and diacritic-insensitive, so "cafe" finds "Café". */
export const normalize = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

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

/**
 * Type-ahead for a list of options (Select's listbox, Menu): the keys typed in quick succession make
 * one string, and `match` jumps to the option whose label starts with it. The string is forgotten
 * after a pause.
 */
export function useTypeahead() {
  const state = useRef({ text: '', timer: 0 });
  useEffect(() => () => window.clearTimeout(state.current.timer), []);

  return {
    /** Whether keys have just been typed, so a Space belongs to the text, not to an action. */
    isTyping: () => state.current.text !== '',
    /**
     * Adds `key` and returns the option to move to. A first letter moves on from the current option
     * (`activeIndex`, or -1); more letters refine from it.
     */
    match<O extends OptionBase>(options: O[], activeIndex: number, key: string): O | undefined {
      const current = state.current;
      window.clearTimeout(current.timer);
      current.text += key;
      current.timer = window.setTimeout(() => {
        current.text = '';
      }, TYPEAHEAD_RESET_MS);
      const from = current.text.length === 1 ? activeIndex : Math.max(activeIndex - 1, -1);
      return findByPrefix(options, current.text, from);
    },
  };
}
