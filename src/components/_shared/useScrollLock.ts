import { useEffect } from 'react';

// How many are locking, so a dialog opened over another doesn't unlock the page when it closes first
let locks = 0;
let unlock: (() => void) | null = null;

/**
 * Stops the page scrolling while `isLocked` (a modal is over it). Taking the page's scrollbar away
 * would widen the page by its width and shift everything, so that width is given back as padding. (Not
 * `scrollbar-gutter: stable`: it keeps the space by drawing an empty track, which can't be scrolled and
 * the backdrop doesn't cover.) Overlay scrollbars have no width, and nothing is added for them.
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;
    if (locks++ === 0) {
      const html = document.documentElement;
      const { overflow, paddingRight } = html.style;
      const scrollbar = window.innerWidth - html.clientWidth;
      if (scrollbar > 0) {
        html.style.paddingRight = `calc(${getComputedStyle(html).paddingRight} + ${scrollbar}px)`;
      }
      html.style.overflow = 'hidden';
      unlock = () => {
        html.style.overflow = overflow;
        html.style.paddingRight = paddingRight;
      };
    }
    return () => {
      if (--locks === 0) {
        unlock?.();
        unlock = null;
      }
    };
  }, [isLocked]);
}
