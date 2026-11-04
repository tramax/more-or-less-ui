import { clsx } from '@/utils/clsx';
import { ModalFrame, MODAL_DEFAULTS, type ModalProps } from '../_shared/ModalFrame';
import { modalClass } from '../_shared/Overlay';
import styles from './Dialog.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const DIALOG_DEFAULTS = MODAL_DEFAULTS;

export type DialogProps = ModalProps;

/**
 * A modal dialog: a window over the page that the person must deal with before going back to it. The
 * page behind it is inert and dimmed, Tab stays inside it, and it closes on Escape and on a press on the
 * backdrop (`isBackdropClosing`). For something the person acts on without leaving the page, use a
 * Popover; for a panel docked to an edge of the page, a Drawer.
 *
 * It is a native `<dialog>` shown with `showModal()`, through `useOverlay` as Popover is, so the
 * browser does the trap and the inert page. Focus goes to the first focusable element inside (or the
 * one with `autoFocus`), and back to the trigger, or to whatever had focus before, when it closes.
 */
export function Dialog(props: DialogProps) {
  return (
    <ModalFrame
      {...props}
      className={clsx(modalClass, styles.dialog)}
      contentClassName={styles.content}
    />
  );
}
