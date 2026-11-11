import type { KeyboardEventHandler } from 'react';
import { clsx } from '@/utils/clsx';
import round from '../_shared/RoundControl.module.css';
import styles from './Calendar.module.css';

export type Choice = {
  /** Also the value `onPick` gets back. */
  key: string;
  /** What is drawn on the cell ("Nov", "2026"). */
  text: string;
  /** What a screen reader says ("November 2026"). */
  label: string;
  /** The month or year that is the calendar's now: filled. */
  isCurrent: boolean;
  /** Where the keyboard is: the one cell in the tab order. */
  isCursor: boolean;
  /** Out of `min` / `max`: dimmed, and pressing it does nothing. */
  isUnavailable: boolean;
};

/**
 * The twelve months of a year, or the twelve years of a page: three columns of round cells that the
 * calendar's header opens to jump far (a birthday is a few years back, not a few months). Buttons in a
 * group with one tab stop, moved by the arrow keys (the calendar's `onKeyDown`).
 */
export function ChoiceGrid({
  choices,
  labelledBy,
  isDisabled,
  onPick,
  onKeyDown,
}: {
  choices: Choice[];
  labelledBy: string;
  isDisabled: boolean;
  onPick: (key: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
}) {
  return (
    // role="group" and not a grid: the cells are choices in a list, not a table of dates
    <div role="group" aria-labelledby={labelledBy} className={styles.choices} onKeyDown={onKeyDown}>
      {choices.map((choice) => (
        <button
          key={choice.key}
          type="button"
          data-cell=""
          data-key={choice.key}
          aria-label={choice.label}
          aria-current={choice.isCurrent ? 'true' : undefined}
          aria-disabled={choice.isUnavailable || undefined}
          disabled={isDisabled}
          tabIndex={choice.isCursor ? 0 : -1}
          className={clsx(round.control, styles.cell, choice.isCurrent && round.current)}
          onClick={() => {
            if (!choice.isUnavailable) onPick(choice.key);
          }}
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
