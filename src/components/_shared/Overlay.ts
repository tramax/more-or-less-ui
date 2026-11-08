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
 * The classes an anchored overlay element takes from Overlay.module.css: `overlay` (motion, finish),
 * `anchored` (placed against its anchor) and the one that says on which side and edge. Tooltip, Popover
 * and Menu pass their `placement` and `align`; the consumer adds its own class for size and surface
 * after it.
 */
export const overlayClass = (placement: OverlayPlacement, align: OverlayAlign = 'center') =>
  clsx(styles.overlay, styles.anchored, PLACEMENT_CLASS[placement][align]);

/**
 * The classes of an overlay that is neither anchored nor modal: the same finish and motion, and the
 * consumer puts it where it goes (Toast's viewport). It grows from the edge that `data-side` names, as an
 * anchored one does: `top` for one that sits above its edge, `bottom` for one below.
 */
export const floatingClass = clsx(styles.overlay);

/** The classes of a modal overlay (Dialog): the same motion and finish, centred in the viewport. */
export const modalClass = clsx(styles.overlay, styles.modal);

/** Which edge of the viewport a docked modal sits against. `start` and `end` follow the writing direction. */
export type OverlayEdge = 'start' | 'end' | 'top' | 'bottom';

const EDGE_CLASS = {
  start: styles.slideStart,
  end: styles.slideEnd,
  top: styles.slideTop,
  bottom: styles.slideBottom,
} as const;

/**
 * The classes of a modal overlay docked to an edge (Drawer): the same finish, but it slides in from
 * that edge instead of growing from its middle.
 */
export const dockedClass = (edge: OverlayEdge) =>
  clsx(styles.overlay, styles.modal, EDGE_CLASS[edge]);
