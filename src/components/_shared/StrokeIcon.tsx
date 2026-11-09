import type { ReactNode } from 'react';

/**
 * The shell of CheckIcon, CrossIcon and ChevronIcon: a 16 × 16 box, a 2-unit round stroke in the
 * current color, decorative. The icon draws its path as `children`; the consumer's class sets size,
 * color and motion.
 */
export const StrokeIcon = ({
  className,
  children,
}: {
  className?: string | undefined;
  children: ReactNode;
}) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);
