import type { ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import shared from './OptionGroup.module.css';

/**
 * An option's `icon` (a flag, an avatar), in the square slot every place that shows it uses: the
 * option row, Select's field and its chips, and Button's `icon`. Decorative: the label (or an
 * icon-only button's `aria-label`) is its name. Position it with `className`.
 */
export function OptionIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx(shared.icon, className)} aria-hidden="true">
      {children}
    </span>
  );
}
