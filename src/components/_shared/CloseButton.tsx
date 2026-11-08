import { clsx } from '@/utils/clsx';
import { CrossIcon } from './CrossIcon';
import styles from './CloseButton.module.css';

/**
 * A round × button that takes the color and font size around it: Banner's dismiss, Toast's, and Dialog's close.
 * It is a plain `type="button"`, in the tab order, named by `label`. Spacing and alignment go through
 * `className`.
 */
export function CloseButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={clsx(styles.button, className)}
      aria-label={label}
      onClick={onClick}
    >
      <CrossIcon className={styles.icon} />
    </button>
  );
}
