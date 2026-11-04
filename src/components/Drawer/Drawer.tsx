import { clsx } from '@/utils/clsx';
import { ModalFrame, MODAL_DEFAULTS, type ModalProps } from '../_shared/ModalFrame';
import { dockedClass, type OverlayEdge } from '../_shared/Overlay';
import styles from './Drawer.module.css';

/** The edge of the page it is docked to. `start` and `end` follow the writing direction. */
export type DrawerPlacement = OverlayEdge;

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const DRAWER_DEFAULTS = {
  ...MODAL_DEFAULTS,
  isBackdropShown: true,
  placement: 'end',
} as const;

export type DrawerProps = ModalProps & {
  /** The edge of the page it slides in from and floats beside. Default `end`. */
  placement?: DrawerPlacement;
  /**
   * Whether the page behind is veiled and blurred. Turn it off to keep the page in view beside the
   * drawer. The page is still inert, and a press where the backdrop would be still closes it unless
   * `isBackdropClosing` is off. Default true.
   */
  isBackdropShown?: boolean;
};

const PLACEMENT_CLASS = {
  start: styles.start,
  end: styles.end,
  top: styles.top,
  bottom: styles.bottom,
} as const;

/**
 * A modal panel that floats beside an edge of the page: a Dialog that slides in from the side (or the top
 * or bottom) and takes that edge's full length, for a form, a filter list or a detail view that deserves
 * more room than a dialog but should keep the page in sight. It behaves as a Dialog does: the page behind
 * it is inert and dimmed (`isBackdropShown`), Tab stays inside it, it closes on Escape and on a press on
 * the backdrop (`isBackdropClosing`), and focus goes back to the trigger. Its `actions` sit at the bottom
 * of the panel, however short the content is.
 */
export function Drawer({ placement = DRAWER_DEFAULTS.placement, ...props }: DrawerProps) {
  return (
    <ModalFrame
      {...props}
      className={clsx(dockedClass(placement), styles.drawer, PLACEMENT_CLASS[placement])}
      contentClassName={styles.content}
    />
  );
}
