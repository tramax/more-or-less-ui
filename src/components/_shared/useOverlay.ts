import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';

// A little longer than the longest exit animation in Overlay.module.css (150ms)
const EXIT_MS = 200;

export interface UseOverlayOptions {
  /** Close on Escape, wherever focus is. Off for a control that handles its own keys (Select). */
  isEscapeClosing?: boolean;
}

/**
 * Open state and showing of an overlay: a Popover API element in the top layer, placed with CSS anchor
 * positioning against an anchor element. This is the one place that knows an overlay is a popover;
 * where it sits is `Overlay.module.css` plus the consumer's `position-area`. To change how overlays
 * are shown or positioned (JS positioning, floating-ui), change those and nothing else.
 *
 * `isOpen` is the state the trigger reports (`aria-expanded`). `isPresent` is whether the overlay is
 * rendered: it outlives `isOpen` by `EXIT_MS`, so it can animate out (`data-state="closed"`) before it
 * unmounts, which is what takes it out of the top layer. Light dismiss is not used
 * (`popover="manual"`): the consumer decides what closes it, so focus never leaves the trigger.
 *
 * The consumer puts `anchorRef` and `anchorStyle` on the anchor element, and spreads `overlayProps`
 * on the overlay (with `Overlay.module.css`'s `overlay` class). Outside-click dismissal and focus
 * return are not here yet: nothing needs them until Popover.
 */
export function useOverlay({ isEscapeClosing = false }: UseOverlayOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  // What `close` checks: it may run from a timer or a listener set up in an earlier render
  const isOpenRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLElement | null>(null);
  // `useId()` returns ":r1:", which isn't valid in a CSS dashed-ident
  const anchorName = `--overlay-${useId().replace(/[^\w-]/g, '')}`;

  useEffect(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    try {
      // Absent in jsdom and in browsers without the Popover API
      overlay?.showPopover?.();
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
  }, [isOpen]);

  useEffect(() => {
    if (!isLeaving) return;
    const timer = window.setTimeout(() => setIsLeaving(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isLeaving]);

  const open = () => {
    isOpenRef.current = true;
    setIsOpen(true);
    setIsLeaving(false);
  };
  const close = () => {
    // Closing an overlay that isn't open (a blur) must not bring it back for its exit
    if (!isOpenRef.current) return;
    isOpenRef.current = false;
    setIsOpen(false);
    setIsLeaving(true);
  };

  useEffect(() => {
    if (!isOpen || !isEscapeClosing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // `close` reads a ref, so the one from this render is as good as any
  }, [isOpen, isEscapeClosing]);

  return {
    isOpen,
    isPresent: isOpen || isLeaving,
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
    /** On the overlay element, with the `overlay` class of Overlay.module.css. */
    overlayProps: {
      ref: overlayRef,
      // `manual`: the consumer closes it, so focus never leaves the trigger
      popover: 'manual',
      style: { positionAnchor: anchorName } as CSSProperties,
      'data-state': isOpen ? 'open' : 'closed',
      // Leaving: still on screen for its exit animation, but no longer there for anyone else
      'aria-hidden': !isOpen || undefined,
    } as const,
  };
}
