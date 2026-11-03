import {
  cloneElement,
  useId,
  useRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { clsx } from '@/utils/clsx';
import { Text } from '../Text';
import { useOverlay } from '../_shared/useOverlay';
import { useTriggerRef, type TriggerProps } from '../_shared/useTriggerRef';
import { modalClass } from '../_shared/Overlay';
import styles from './Dialog.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const DIALOG_DEFAULTS = {
  role: 'dialog',
} as const;

/** The visible `title` names the dialog; without one, `aria-label` or `aria-labelledby` must. */
type DialogName =
  | { title: string }
  | { title?: undefined; 'aria-label': string }
  | { title?: undefined; 'aria-labelledby': string };

export type DialogProps = DialogName & {
  /**
   * What opens it: one element that takes a `ref` and `onClick` (a Button, a native element). Leave it
   * out to open the dialog from state (`isOpen`), as a confirmation opened by a Menu item is.
   */
  trigger?: ReactElement;
  /** What it holds: text, a form. Put `autoFocus` on the element that should take focus when it opens. */
  children: ReactNode;
  /** The row of buttons under the content, end-aligned. */
  actions?: ReactNode;
  /**
   * `alertdialog` is a dialog that interrupts to ask for an answer (delete this?). It should be
   * described (`aria-describedby`), and a press on the backdrop doesn't close it. Default `dialog`.
   */
  role?: 'dialog' | 'alertdialog';
  /** The id of the element that says what is being asked; for an `alertdialog`. */
  'aria-describedby'?: string;
  /** Whether a press on the backdrop closes it. Default true, and false for an `alertdialog`. */
  isBackdropClosing?: boolean;
  /** Controlled: whether it is open. Pair it with `onOpenChange`. */
  isOpen?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultIsOpen?: boolean;
  /** Called with the new state when the trigger, Escape or the backdrop changes it. */
  onOpenChange?: (isOpen: boolean) => void;
};

/**
 * A modal dialog: a window over the page that the person must deal with before going back to it. The
 * page behind it is inert and dimmed, Tab stays inside it, and it closes on Escape and (unless it is an
 * `alertdialog`) on a press on the backdrop. For something the person acts on without leaving the page,
 * use a Popover.
 *
 * It is a native `<dialog>` shown with `showModal()`, through `useOverlay` as Popover is, so the
 * browser does the trap and the inert page. Focus goes to the first focusable element inside (or the
 * one with `autoFocus`), and back to the trigger, or to whatever had focus before, when it closes.
 */
export function Dialog({
  trigger,
  children,
  title,
  actions,
  role = DIALOG_DEFAULTS.role,
  isBackdropClosing = role === 'dialog',
  isOpen,
  defaultIsOpen,
  onOpenChange,
  ...name
}: DialogProps) {
  const overlay = useOverlay<HTMLDialogElement>({
    isModal: true,
    isEscapeClosing: true,
    isFocusReturned: true,
    isOpen,
    defaultIsOpen,
    onOpenChange,
  });
  const id = useId();
  const titleId = `${id}-title`;
  const triggerProps = trigger?.props as TriggerProps | undefined;
  const setRef = useTriggerRef(trigger, overlay.anchorRef);

  // A drag that starts on the content and ends on the backdrop is a click on the dialog, and must
  // not close it: the press has to start on the backdrop too
  const isBackdropPressed = useRef(false);

  return (
    <>
      {trigger &&
        cloneElement(
          trigger as ReactElement<TriggerProps>,
          {
            ref: setRef,
            'aria-haspopup': 'dialog',
            'aria-expanded': overlay.isOpen,
            'aria-controls': overlay.isOpen ? id : undefined,
            onClick: (event: MouseEvent<HTMLElement>) => {
              triggerProps?.onClick?.(event);
              if (!event.defaultPrevented) overlay.open();
            },
          } as Partial<TriggerProps>,
        )}
      {overlay.isPresent && (
        <dialog
          {...overlay.overlayProps}
          // With a `title` there is no other name to pass (the type), so the spread leaves this alone
          aria-labelledby={title === undefined ? undefined : titleId}
          {...name}
          id={id}
          role={role}
          aria-modal="true"
          // Where focus lands when nothing inside can take it
          tabIndex={-1}
          className={clsx(modalClass, styles.dialog)}
          // The backdrop is the dialog element itself: the content is a child that fills it
          onPointerDown={(event) => {
            isBackdropPressed.current = event.target === event.currentTarget;
          }}
          onClick={(event) => {
            if (
              isBackdropClosing &&
              isBackdropPressed.current &&
              event.target === event.currentTarget
            ) {
              overlay.close();
            }
          }}
        >
          <div className={styles.content}>
            {title !== undefined && (
              <Text as="h2" id={titleId} size="more" fontWeight="more">
                {title}
              </Text>
            )}
            {children}
            {actions && <div className={styles.actions}>{actions}</div>}
          </div>
        </dialog>
      )}
    </>
  );
}
