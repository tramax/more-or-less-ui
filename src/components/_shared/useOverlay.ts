import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from 'react';

// A little longer than the longest exit animation in Overlay.module.css (150ms)
const EXIT_MS = 200;

// The overlays listening for Escape, the one opened last at the end: only that one closes, so Escape in
// a Menu or Popover inside a Dialog closes the Menu and the Dialog stays
const escapeListeners: object[] = [];

export interface UseOverlayOptions {
  /**
   * A modal dialog, not a popover: shown with `showModal()` on a `<dialog>`, so the rest of the page is
   * inert and the browser draws a `::backdrop`. It has no anchor to be placed against, and focus goes
   * back to what had it when it opened if there is no anchor (Dialog).
   */
  isModal?: boolean;
  /** Close on Escape, wherever focus is. Off for a control that handles its own keys (Select). */
  isEscapeClosing?: boolean;
  /**
   * Close when a pointer is pressed, or focus moves, anywhere outside both the overlay and its anchor
   * (Popover). Off for an overlay whose anchor keeps focus, so a blur already says it (Select).
   */
  isOutsideClosing?: boolean;
  /**
   * When it closes while focus is inside it (or has been lost to the page, because what had it was
   * removed), put focus back on the anchor. Not after a press outside: focus goes where that press went.
   */
  isFocusReturned?: boolean;
  /** Controlled: whether it is open. Leave it out and the overlay keeps its own state. */
  isOpen?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultIsOpen?: boolean;
  /** Called with the new state when `open` or `close` changes it, so a controlled caller can follow. */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Open state and showing of an overlay: a Popover API element in the top layer, placed with CSS anchor
 * positioning against an anchor element. This is the one place that knows an overlay is a popover;
 * where it sits is `Overlay.module.css` plus the consumer's `position-area`. To change how overlays
 * are shown or positioned (JS positioning, floating-ui), change those and nothing else.
 *
 * `isOpen` is the state the trigger reports (`aria-expanded`). `isPresent` is whether the overlay is
 * rendered: it outlives `isOpen` by `EXIT_MS`, so it can animate out (`data-state="closed"`) before it
 * unmounts, which is what takes it out of the top layer. Light dismiss is not the native one
 * (`popover="manual"`): the consumer decides what closes it, with the options above.
 *
 * The consumer puts `anchorRef` and `anchorStyle` on the anchor element, and spreads `overlayProps`
 * on the overlay (with `Overlay.module.css`'s `overlay` class). The options are opt-in, and each is
 * the whole of its behavior: an overlay that sets none is closed only by its consumer.
 */
export function useOverlay<Element extends HTMLElement = HTMLDivElement>({
  isModal = false,
  isEscapeClosing = false,
  isOutsideClosing = false,
  isFocusReturned = false,
  isOpen: isOpenProp,
  defaultIsOpen = false,
  onOpenChange,
}: UseOverlayOptions = {}) {
  const [internalOpen, setInternalOpen] = useState(defaultIsOpen);
  const isOpen = isOpenProp ?? internalOpen;
  const [isLeaving, setIsLeaving] = useState(false);
  // Leaving starts in the render where it closes, not in an effect after it: for one frame there
  // would be neither an open overlay nor a leaving one, and it would unmount and mount again.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setIsLeaving(!isOpen);
  }
  // What `open` and `close` check: they may run from a timer or a listener set up in an earlier render
  const isOpenRef = useRef(isOpen);
  const onOpenChangeRef = useRef(onOpenChange);
  const overlayRef = useRef<Element>(null);
  const anchor = useRef<HTMLElement | null>(null);
  // Where focus was when a modal opened: showModal() moves it, and a Dialog needs no trigger
  const opener = useRef<HTMLElement | null>(null);
  // `useId()` returns ":r1:", which isn't valid in a CSS dashed-ident
  const anchorName = `--overlay-${useId().replace(/[^\w-]/g, '')}`;

  useEffect(() => {
    isOpenRef.current = isOpen;
    onOpenChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    if (isModal && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement;
    }
    try {
      // Absent in jsdom and in browsers without the Popover API or <dialog>
      if (isModal) (overlay as HTMLDialogElement | null)?.showModal?.();
      else overlay?.showPopover?.();
    } catch {
      // Already showing (reopened while it was leaving)
    }
    // It flips above the anchor when there is no room below, and grows from the anchor either way.
    // Set on the element, not as a prop: it is read once the popover has been placed.
    const anchorEl = anchor.current;
    if (overlay && anchorEl) {
      const above = overlay.getBoundingClientRect().top < anchorEl.getBoundingClientRect().top;
      overlay.dataset.side = above ? 'top' : 'bottom';
    }
  }, [isOpen, isModal]);

  useEffect(() => {
    if (!isLeaving) return;
    const timer = window.setTimeout(() => setIsLeaving(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isLeaving]);

  const setOpen = (next: boolean) => {
    // Closing an overlay that isn't open (a blur) must not bring it back for its exit
    if (isOpenRef.current === next) return;
    // Controlled, it is the caller's to change: the ref follows once the prop does
    if (isOpenProp === undefined) {
      isOpenRef.current = next;
      setInternalOpen(next);
    }
    onOpenChangeRef.current?.(next);
  };
  const open = () => setOpen(true);
  const close = () => setOpen(false);

  // Set by a press outside, which closes it and must not take focus back from where that press goes.
  // Reset on a timer: a controlled caller may refuse the close, and then no effect will clear it.
  const isPressClosing = useRef(false);
  // A modal keeps the page inert while it leaves, and an inert anchor can't take focus: it is
  // returned once the dialog is gone, not when it starts to leave
  const isPresent = isOpen || isLeaving;
  const isShown = isModal ? isPresent : isOpen;
  const wasShownRef = useRef(isShown);
  useEffect(() => {
    const was = wasShownRef.current;
    wasShownRef.current = isShown;
    if (!was || isShown || !isFocusReturned || isPressClosing.current) return;
    const active = document.activeElement;
    // The overlay is still mounted, leaving, so focus that was in it is still there
    if (!active || active === document.body || overlayRef.current?.contains(active)) {
      const back = anchor.current ?? (opener.current?.isConnected ? opener.current : null);
      back?.focus();
    }
  }, [isShown, isFocusReturned]);

  useEffect(() => {
    if (!isOpen || !isEscapeClosing) return;
    const listener = {};
    escapeListeners.push(listener);
    const onKeyDown = (event: KeyboardEvent) => {
      // Not when a control already used the key (Select closing its popup), nor when an overlay
      // opened after this one is open
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (escapeListeners[escapeListeners.length - 1] === listener) close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      escapeListeners.splice(escapeListeners.indexOf(listener), 1);
    };
    // `close` reads refs, so the one from this render is as good as any
  }, [isOpen, isEscapeClosing]);

  useEffect(() => {
    if (!isOpen || !isOutsideClosing) return;
    const isOutside = (target: EventTarget | null) =>
      target instanceof Node &&
      !overlayRef.current?.contains(target) &&
      // The anchor is the trigger: its own press toggles, and closing here too would reopen it
      !anchor.current?.contains(target);
    // Capture, so a handler inside that stops the event doesn't hide it from here
    const onPointerDown = (event: PointerEvent) => {
      if (!isOutside(event.target)) return;
      isPressClosing.current = true;
      window.setTimeout(() => {
        isPressClosing.current = false;
      }, 0);
      close();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isOutside(event.target)) close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [isOpen, isOutsideClosing]);

  const shared = {
    ref: overlayRef,
    'data-state': isOpen ? 'open' : 'closed',
    // Leaving: still on screen for its exit animation, but no longer there for anyone else
    'aria-hidden': !isOpen || undefined,
  } as const;

  return {
    isOpen,
    isPresent,
    open,
    close,
    toggle: () => (isOpen ? close() : open()),
    overlayRef,
    /** A callback ref, so it composes with the trigger's own and fits any element. */
    anchorRef: useCallback((node: HTMLElement | null) => {
      anchor.current = node;
    }, []),
    /** On the anchor element: names it for the overlay to be placed against. */
    anchorStyle: { anchorName } as CSSProperties,
    /**
     * On the overlay element, with the `overlay` class of Overlay.module.css (and `anchored`, if it is
     * placed against the anchor).
     */
    overlayProps: isModal
      ? ({
          ...shared,
          // Escape would otherwise close the <dialog> behind our back, with no exit animation
          onCancel: (event: SyntheticEvent) => event.preventDefault(),
        } as const)
      : ({
          ...shared,
          // `manual`: the consumer closes it, so focus never leaves the trigger
          popover: 'manual',
          style: { positionAnchor: anchorName } as CSSProperties,
        } as const),
  };
}
