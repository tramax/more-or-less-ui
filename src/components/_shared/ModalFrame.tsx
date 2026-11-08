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
import { CloseButton } from './CloseButton';
import { useToastHost } from './ToastHost';
import { useOverlay } from './useOverlay';
import { useScrollLock } from './useScrollLock';
import { useTriggerRef, type TriggerProps } from './useTriggerRef';
import styles from './ModalFrame.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const MODAL_DEFAULTS = {
  isBackdropClosing: true,
  isCloseButtonShown: true,
} as const;

/** The visible `title` names the modal; without one, `aria-label` or `aria-labelledby` must. */
type ModalName =
  | { title: string }
  | { title?: undefined; 'aria-label': string }
  | { title?: undefined; 'aria-labelledby': string };

export type ModalProps = ModalName & {
  /**
   * What opens it: one element that takes a `ref` and `onClick` (a Button, a native element). Leave it
   * out to open it from state (`isOpen`), as a confirmation opened by a Menu item is.
   */
  trigger?: ReactElement;
  /** What it holds: text, a form. Put `autoFocus` on the element that should take focus when it opens. */
  children: ReactNode;
  /** The row of buttons under the content, end-aligned. */
  actions?: ReactNode;
  /** The id of the element that says what is being asked, for a confirmation: read out after the name. */
  'aria-describedby'?: string;
  /**
   * Whether a press on the backdrop closes it. Turn it off for a form with unsaved input or a question
   * that needs an answer. Escape and your own buttons still close it. Default true.
   */
  isBackdropClosing?: boolean;
  /**
   * Whether the × at the top right is shown. Turn it off when the actions are the only way out (a
   * question that needs an answer). Escape and the backdrop still close it. Default true.
   */
  isCloseButtonShown?: boolean;
  /** Controlled: whether it is open. Pair it with `onOpenChange`. */
  isOpen?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultIsOpen?: boolean;
  /** Called with the new state when the trigger, Escape or the backdrop changes it. */
  onOpenChange?: (isOpen: boolean) => void;
};

/**
 * Everything a modal has but its place on the screen: Dialog's and Drawer's behavior and the structure
 * inside. It is a native `<dialog>` shown with `showModal()`, through `useOverlay`, so the browser does
 * the trap and the inert page. Focus goes to the first focusable element inside (or the one with
 * `autoFocus`), and back to the trigger, or to whatever had focus before, when it closes.
 *
 * The consumer passes `className` for the `<dialog>` element: the overlay classes from `Overlay.ts`
 * (which say how it moves), its size and position, and the `--modal-background` / `--modal-backdrop`
 * hooks set from its own tokens. `contentClassName` is for the box around the header, children and
 * actions, which is what scrolls: a `max-height` or `min-height`.
 */
export function ModalFrame({
  trigger,
  children,
  title,
  actions,
  isBackdropClosing = MODAL_DEFAULTS.isBackdropClosing,
  isCloseButtonShown = MODAL_DEFAULTS.isCloseButtonShown,
  isOpen,
  defaultIsOpen,
  onOpenChange,
  className,
  contentClassName,
  isBackdropShown = true,
  ...name
}: ModalProps & {
  className?: string;
  contentClassName?: string;
  /**
   * Whether the page behind is veiled and blurred. Not in `ModalProps`: a modal opts in by exposing it
   * (Drawer). Off, the page is still inert, and a press on where the backdrop would be still closes it
   * (`isBackdropClosing`).
   */
  isBackdropShown?: boolean;
}) {
  const overlay = useOverlay<HTMLDialogElement>({
    isModal: true,
    isEscapeClosing: true,
    isFocusReturned: true,
    isOpen,
    defaultIsOpen,
    onOpenChange,
  });
  // For as long as it is on screen, exit animation included: the page is inert until then
  useScrollLock(overlay.isPresent);
  // Toasts fired while it is open show inside it: the rest of the page is inert. `isOpen`, not
  // `isPresent`, so they are back on the page before the <dialog> is removed.
  useToastHost(overlay.overlayRef, overlay.isOpen);
  const id = useId();
  const titleId = `${id}-title`;
  const triggerProps = trigger?.props as TriggerProps | undefined;
  const setRef = useTriggerRef(trigger, overlay.anchorRef);

  // A drag that starts on the content and ends on the backdrop is a click on the modal, and must
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
          role="dialog"
          aria-modal="true"
          // Where focus lands when nothing inside can take it
          tabIndex={-1}
          className={clsx(className, styles.frame, !isBackdropShown && styles.backdropHidden)}
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
          <div className={clsx(styles.content, contentClassName)}>
            {(title !== undefined || isCloseButtonShown) && (
              <div className={styles.header}>
                {title !== undefined && (
                  <Text as="h2" id={titleId} size="more" fontWeight="more" className={styles.title}>
                    {title}
                  </Text>
                )}
                {isCloseButtonShown && (
                  <CloseButton className={styles.close} label="Close" onClick={overlay.close} />
                )}
              </div>
            )}
            {children}
            {actions && <div className={styles.actions}>{actions}</div>}
          </div>
        </dialog>
      )}
    </>
  );
}
