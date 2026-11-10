import { useEffect, useLayoutEffect, useRef, useState, type RefCallback } from 'react';
import { clsx } from '@/utils/clsx';
import styles from './SlidingThumb.module.css';

// Measuring has to happen before paint, or the thumb would be seen jumping; on a server there is
// nothing to measure and useLayoutEffect only warns
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type ThumbBox = { x: number; y: number; width: number; height: number };
const sameBox = (a: ThumbBox, b: ThumbBox) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

/**
 * The box of the thumb behind the selected option of Tabs and SegmentedControl: measured from the
 * option's element, so that it follows any size, font or icon. It is one element that moves, so it can
 * slide.
 *
 * Give each option's element `ref(value)`; `elements` is those elements by value, for a component that
 * also needs to find one (Tabs moves focus). `layoutKey` is whatever else changes where the options
 * sit and is not a resize (Tabs' `orientation`). The box is `null` while nothing is selected.
 */
export function useSlidingThumb(selectedValue: string | undefined, layoutKey?: string) {
  const elements = useRef(new Map<string, HTMLElement>());
  const [box, setBox] = useState<ThumbBox | null>(null);

  useIsomorphicLayoutEffect(() => {
    const element = selectedValue === undefined ? undefined : elements.current.get(selectedValue);
    if (!element) return setBox(null);
    const measure = () => {
      const next = {
        x: element.offsetLeft,
        y: element.offsetTop,
        width: element.offsetWidth,
        height: element.offsetHeight,
      };
      // The same box is the same state, so a resize that moved nothing renders nothing
      setBox((prev) => (prev && sameBox(prev, next) ? prev : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    // The option itself changing size (a longer label, a bigger font) and the list around it
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.parentElement) observer.observe(element.parentElement);
    return () => observer.disconnect();
  }, [selectedValue, layoutKey]);

  const ref =
    (value: string): RefCallback<HTMLElement> =>
    (node) => {
      if (node) elements.current.set(value, node);
      else elements.current.delete(value);
    };

  return { box, elements, ref };
}

/**
 * The thumb itself. It is placed from the physical top-left corner (offsets are physical too), so it
 * holds in a right-to-left list. It mounts already in place, with no slide in from the corner. The
 * consumer's `className` gives its fill, radius and shadow.
 */
export function SlidingThumb({ box, className }: { box: ThumbBox | null; className?: string }) {
  if (!box) return null;
  return (
    <span
      aria-hidden="true"
      className={clsx(styles.thumb, className)}
      style={{
        width: box.width,
        height: box.height,
        transform: `translate(${box.x}px, ${box.y}px)`,
      }}
    />
  );
}
