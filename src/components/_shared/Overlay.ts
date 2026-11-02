import { clsx } from '@/utils/clsx';
import styles from './Overlay.module.css';

/** Which side of the anchor an overlay opens on. It flips to the other when there is no room. */
export type OverlayPlacement = 'top' | 'bottom';

/** Which edge of the anchor it lines up with: its start edge, its end edge, or centered on it. */
export type OverlayAlign = 'start' | 'center' | 'end';

const PLACEMENT_CLASS = {
  top: { start: styles.topStart, center: styles.top, end: styles.topEnd },
  bottom: { start: styles.bottomStart, center: styles.bottom, end: styles.bottomEnd },
} as const;

/**
 * The classes an overlay element takes from Overlay.module.css: `overlay` (top layer, motion, finish)
 * and the one that places it. Tooltip and Popover pass their `placement` and `align`; the consumer adds
 * its own class for size and surface after it.
 */
export const overlayClass = (placement: OverlayPlacement, align: OverlayAlign = 'center') =>
  clsx(styles.overlay, PLACEMENT_CLASS[placement][align]);
