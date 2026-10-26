import styles from './SelectChip.module.css';

interface SelectChipProps {
  label: string;
  /** Without it the chip has no remove button (a disabled option, or a disabled Select). */
  onRemove?: () => void;
}

// Private to Select for now. When a Badge is built (DESIGN.md lists one), this becomes that, in
// `_shared/`, and Select imports it.
/** One selected value in a multiple Select's field. */
export function SelectChip({ label, onRemove }: SelectChipProps) {
  return (
    <span className={styles.chip}>
      <span className={styles.label}>{label}</span>
      {onRemove && (
        // Out of the tab order so the field is one Tab stop; Backspace in the input removes the last
        // chip from the keyboard. mousedown is cancelled so the input keeps focus.
        <button
          type="button"
          tabIndex={-1}
          className={styles.remove}
          aria-label={`Remove ${label}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onRemove}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
          </svg>
        </button>
      )}
    </span>
  );
}
