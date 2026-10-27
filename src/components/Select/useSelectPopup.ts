import { useEffect, useRef, useState } from 'react';

// A little longer than the longest exit animation in Select.module.css (150ms)
const EXIT_MS = 200;

/**
 * Open state and showing of the Select's popup. This is the one place that knows the popup is a
 * Popover API element; where it sits is the "Positioning" section of Select.module.css. To change
 * how it is shown or positioned (JS positioning, floating-ui), change those two and nothing else.
 *
 * `isOpen` is the state the control reports (`aria-expanded`). `isPresent` is whether the popup is
 * rendered: it outlives `isOpen` by `EXIT_MS`, so the popup can animate out (`data-state="closed"`)
 * before it unmounts, which is what takes it out of the top layer. Light dismiss is not used
 * (`popover="manual"`): focus stays on the control, which closes the popup itself on blur and Escape.
 */
export function useSelectPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const popup = popupRef.current;
    try {
      // Absent in jsdom and in browsers without the Popover API
      popup?.showPopover?.();
    } catch {
      // Already showing (reopened while it was leaving)
    }
    // The popup flips above the field when there is no room below; it grows from the field either
    // way. Set on the element, not as a prop: it is read once the popover has been placed.
    const field = popup?.parentElement;
    if (popup && field) {
      const above = popup.getBoundingClientRect().top < field.getBoundingClientRect().top;
      popup.dataset.side = above ? 'top' : 'bottom';
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isLeaving) return;
    const timer = window.setTimeout(() => setIsLeaving(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isLeaving]);

  const open = () => {
    setIsOpen(true);
    setIsLeaving(false);
  };
  const close = () => {
    // Closing a popup that isn't open (a blur) must not bring it back for its exit
    if (!isOpen) return;
    setIsOpen(false);
    setIsLeaving(true);
  };

  return {
    isOpen,
    isPresent: isOpen || isLeaving,
    popupRef,
    open,
    close,
    toggle: () => (isOpen ? close() : open()),
  };
}
