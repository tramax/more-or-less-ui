import { clsx } from '@/utils/clsx';
import styles from './Spinner.module.css';

/**
 * The loading ring (Button, Select). It is hidden from assistive tech: the component that shows it
 * says what is loading, with `aria-busy` or a status. Position it with `className`.
 */
export function Spinner({ className }: { className?: string }) {
  return <span className={clsx(styles.spinner, className)} aria-hidden="true" />;
}
