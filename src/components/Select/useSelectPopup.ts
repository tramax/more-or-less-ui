import { useEffect, useRef, useState } from 'react';

/**
 * Open state and showing of the Select's popup. This is the one place that knows the popup is a
 * Popover API element; where it sits is the "Positioning" section of Select.module.css. To change
 * how it is shown or positioned (JS positioning, floating-ui), change those two and nothing else.
 *
 * The popup is rendered only while open, so closing needs no `hidePopover()`: unmounting takes it
 * out of the top layer. Light dismiss is not used (`popover="manual"`): focus stays on the control,
 * which closes the popup itself on blur and Escape.
 */
export function useSelectPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      // Absent in jsdom and in browsers without the Popover API
      popupRef.current?.showPopover?.();
    } catch {
      // Already showing
    }
  }, [isOpen]);

  return {
    isOpen,
    popupRef,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((open) => !open),
  };
}
