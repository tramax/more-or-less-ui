import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` in a browser, `useEffect` on a server. Measuring has to happen before paint, or
 * the result would be seen jumping; on a server there is nothing to measure and `useLayoutEffect`
 * only warns (React 18). Every component that measures in a layout effect uses this one.
 */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
