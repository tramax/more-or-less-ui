import { useEffect, useState } from 'react';

// A little longer than the longest exit animation in Overlay.module.css (150ms)
export const EXIT_MS = 200;

/**
 * Whether something is still on screen: while `isOpen`, and for `EXIT_MS` after it closes, so it can
 * animate out (`data-state="closed"`) before the caller unmounts it. useOverlay keeps an overlay this
 * way, and Toast keeps each toast, for as long as its own exit takes (`exitMs`).
 */
export function usePresence(isOpen: boolean, exitMs = EXIT_MS) {
  const [isLeaving, setIsLeaving] = useState(false);
  // Leaving starts in the render where it closes, not in an effect after it: for one frame there
  // would be neither an open element nor a leaving one, and it would unmount and mount again.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setIsLeaving(!isOpen);
  }

  useEffect(() => {
    if (!isLeaving) return;
    const timer = window.setTimeout(() => setIsLeaving(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [isLeaving, exitMs]);

  return isOpen || isLeaving;
}
