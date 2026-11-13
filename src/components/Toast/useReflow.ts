import { useRef, type RefObject } from 'react';
import { useIsomorphicLayoutEffect } from '../_shared/useIsomorphicLayoutEffect';

// How long a toast takes to glide to its new place
export const REFLOW_MS = 250;

/**
 * Glides the children of `ref` to their new places when the column changes: a toast added at the edge
 * moves the others up, one removed moves them back. Without it they jump a whole toast in one frame
 * (FLIP: read where each child was, read where it is now, and animate the difference away).
 *
 * It animates `translate`, a property of its own that composes with the `transform` the overlay's
 * enter and leave animations use, so the two don't fight. A child it has not seen before is new, and
 * comes in with its own motion. Not under `prefers-reduced-motion`, and not where there is no
 * Web Animations API (jsdom).
 */
export function useReflow(ref: RefObject<HTMLElement | null>) {
  const tops = useRef(new WeakMap<Element, number>());
  const gliding = useRef(new WeakMap<Element, Animation>());

  // Every render: the column may have changed in any of them
  useIsomorphicLayoutEffect(() => {
    const container = ref.current;
    // Not laid out yet: the viewport is `display: none` until it has shown itself (showPopover, in an
    // effect that runs after this one), and everything in it reads as being at 0. Measured then, the
    // first toast would be "moved" from the top of the page to its place by the next render.
    if (!container || getComputedStyle(container).display === 'none') return;
    const isReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // `offsetTop` is the layout place, which a transform doesn't move; the viewport's own place does
    // change (it is anchored to an edge, so it grows away from it)
    const base = container.getBoundingClientRect().top;

    for (const child of Array.from(container.children) as HTMLElement[]) {
      const top = base + child.offsetTop;
      const before = tops.current.get(child);
      tops.current.set(child, top);
      if (before === undefined || Math.abs(before - top) < 1) continue;
      if (isReduced || typeof child.animate !== 'function') continue;

      gliding.current.get(child)?.cancel();
      gliding.current.set(
        child,
        child.animate([{ translate: `0 ${before - top}px` }, { translate: '0 0' }], {
          duration: REFLOW_MS,
          // The token, so it is one place: it is a cubic-bezier, which animate() takes as is
          easing: getComputedStyle(child).getPropertyValue('--ease-leave').trim() || 'ease',
        }),
      );
    }
  });
}
