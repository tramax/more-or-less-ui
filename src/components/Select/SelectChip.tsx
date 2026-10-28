import type { ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { OptionIcon } from '../_shared/OptionIcon';
import { CrossIcon } from '../_shared/CrossIcon';
import styles from './SelectChip.module.css';

interface SelectChipProps {
  label: string;
  /** The option's icon, before the label. */
  icon?: ReactNode;
  /** Without it the chip has no remove button (a disabled option, or a disabled Select). */
  onRemove?: () => void;
}

// Private to Select for now. When a Badge is built (DESIGN.md lists one), this becomes that, in
// `_shared/`, and Select imports it.
/** One selected value in a multiple Select's field. */
export function SelectChip({ label, icon, onRemove }: SelectChipProps) {
  return (
    // The whole chip is the target, so a click anywhere on it removes. The button inside is its
    // accessible name and what assistive tech activates; its click bubbles up to here. mousedown is
    // cancelled so the input keeps focus. The click is marked handled (preventDefault) so the
    // field around the chip doesn't also open its popup.
    <span
      className={clsx(styles.chip, onRemove && styles.removable)}
      onMouseDown={onRemove && ((event) => event.preventDefault())}
      onClick={
        onRemove &&
        ((event) => {
          event.preventDefault();
          onRemove();
        })
      }
    >
      {icon != null && icon !== false && <OptionIcon className={styles.leading}>{icon}</OptionIcon>}
      <span className={styles.label}>{label}</span>
      {onRemove && (
        // Out of the tab order so the field is one Tab stop; Backspace in the input removes the last
        // chip from the keyboard.
        <button
          type="button"
          tabIndex={-1}
          className={styles.remove}
          aria-label={`Remove ${label}`}
        >
          <CrossIcon className={styles.icon} />
        </button>
      )}
    </span>
  );
}
