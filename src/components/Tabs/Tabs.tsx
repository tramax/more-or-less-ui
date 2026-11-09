import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { floatingClass } from '../_shared/Overlay';
import { OptionIcon } from '../_shared/OptionIcon';
import { stepEnabled } from '../_shared/optionNavigation';
import sizes from '../_shared/Size.module.css';
import type { OptionBase } from '../_shared/types';
import styles from './Tabs.module.css';

// Measuring has to happen before paint, or the thumb would be seen jumping; on a server there is
// nothing to measure and useLayoutEffect only warns
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const TABS_DEFAULTS = {
  size: 'normal',
} as const;

// `size` sets font-size only: the padding and the gaps are in em (see Tabs.module.css), so they follow
// it, escape-hatch values included. Its classes are _shared/Size.module.css, since `size` is the only
// scale prop.
const SCALE_SPEC = {
  // Empty, so the direct props are inferred as none rather than as any string
  direct: [],
  compound: { size: ['fontSize'] },
  defaults: TABS_DEFAULTS,
} as const;

type Box = { x: number; y: number; width: number; height: number };
const sameBox = (a: Box, b: Box) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

export type TabItem = Omit<OptionBase, 'description'> & {
  /** A glyph before the label. Decorative: `label` stays the name. */
  icon?: ReactNode;
  /** What the panel shows while this tab is selected. Only the selected tab's content is mounted. */
  content: ReactNode;
};

export type TabsProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'color' | 'children' | 'role'
> & {
  /** The tabs, in order, each with the content of its panel. */
  items: TabItem[];
  /**
   * The selected tab. Always controlled: the parent owns it, since what the screen shows follows it
   * (and it may belong in the URL). A value that names no tab selects the first enabled one.
   */
  value: string;
  /** Called with the `value` of the tab that was chosen (not when the chosen one is chosen again). */
  onChange: (value: string) => void;
  /**
   * `horizontal`: tabs in a row above the panel, moved with ← →. `vertical`: tabs in a column beside
   * it, moved with ↑ ↓. Default `horizontal`.
   */
  orientation?: 'horizontal' | 'vertical';
  /** Sets the font size; the padding and the gaps follow it. `1em` takes the surrounding text's size. */
  size?: ScaleProp;
  /**
   * Names the row of tabs. Optional, since each tab is named by its label; worth setting when a page
   * has more than one set of tabs.
   */
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

/**
 * One panel at a time, chosen from a row (or column) of tabs: sections of one thing (a settings page,
 * a record's details). For moving between pages use links; for choosing a *value* use Radio.
 *
 * Follows the WAI-ARIA APG tabs pattern with automatic activation: the arrow keys move focus and select
 * together, Home and End go to the first and last tab, and Tab leaves the row for the panel. Only the
 * selected tab is in the tab order (roving `tabIndex`). Disabled tabs are skipped.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    items,
    value,
    onChange,
    orientation = 'horizontal',
    size,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    id,
    className,
    style,
    ...props
  },
  ref,
) {
  const {
    classNames,
    style: scaleStyle,
    rest,
  } = resolveScaleProps(sizes, SCALE_SPEC, { ...props, size });
  const autoId = useId();
  const rootId = id ?? autoId;
  const tabId = (item: TabItem) => `${rootId}-tab-${items.indexOf(item)}`;
  const panelId = `${rootId}-panel`;

  const firstEnabled = stepEnabled(items, -1, 1);
  // A value that names no tab falls back to the first one that can be chosen
  const selected = items.find((item) => item.value === value) ?? firstEnabled;
  // The one tab Tab reaches. A selected tab that is disabled can't take focus.
  const tabStop = selected && !selected.isDisabled ? selected : firstEnabled;

  const tabRefs = useRef(new Map<string, HTMLElement>());

  // The thumb behind the selected tab: its box, measured from the tab so that it follows any size,
  // font or icon. It is one element that moves, so it can slide.
  const [thumb, setThumb] = useState<Box | null>(null);
  const selectedValue = selected?.value;
  useIsomorphicLayoutEffect(() => {
    const tab = selectedValue === undefined ? undefined : tabRefs.current.get(selectedValue);
    if (!tab) return setThumb(null);
    const measure = () => {
      const next = {
        x: tab.offsetLeft,
        y: tab.offsetTop,
        width: tab.offsetWidth,
        height: tab.offsetHeight,
      };
      // The same box is the same state, so a resize that moved nothing renders nothing
      setThumb((prev) => (prev && sameBox(prev, next) ? prev : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    // The tab itself changing size (a longer label, a bigger font) and the list around it
    const observer = new ResizeObserver(measure);
    observer.observe(tab);
    if (tab.parentElement) observer.observe(tab.parentElement);
    return () => observer.disconnect();
  }, [selectedValue, orientation]);

  const choose = (item: TabItem) => {
    if (item.isDisabled || item.value === selected?.value) return;
    onChange(item.value);
  };
  // The focus *is* the position, so there is no state for it: each tab's element is found here
  const moveTo = (item: TabItem | undefined) => {
    if (!item) return;
    tabRefs.current.get(item.value)?.focus();
    choose(item);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const { key } = event;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const isHorizontal = orientation === 'horizontal';
    const isRtl = isHorizontal && getComputedStyle(event.currentTarget).direction === 'rtl';
    const forward = isHorizontal ? (isRtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const backward = isHorizontal ? (isRtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';

    if (key === 'Home') {
      moveTo(stepEnabled(items, -1, 1));
    } else if (key === 'End') {
      moveTo(stepEnabled(items, items.length, -1));
    } else if (key === forward || key === backward) {
      const step = key === forward ? 1 : -1;
      const from = items.findIndex(
        (item) => tabRefs.current.get(item.value) === document.activeElement,
      );
      if (from === -1) return;
      // Wraps, as a native radio group does
      moveTo(
        stepEnabled(items, from, step) ?? stepEnabled(items, step === 1 ? -1 : items.length, step),
      );
    } else {
      return;
    }
    event.preventDefault();
  };

  return (
    <div
      {...rest}
      ref={ref}
      id={id}
      className={clsx(styles.root, styles[orientation], classNames, className)}
      style={{ ...scaleStyle, ...style }}
    >
      <div
        role="tablist"
        aria-orientation={orientation}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={clsx(floatingClass, styles.list)}
        onKeyDown={onKeyDown}
      >
        {thumb && (
          <span
            aria-hidden="true"
            className={styles.thumb}
            style={{
              width: thumb.width,
              height: thumb.height,
              transform: `translate(${thumb.x}px, ${thumb.y}px)`,
            }}
          />
        )}
        {items.map((item) => {
          const isSelected = item === selected;
          return (
            <button
              key={item.value}
              ref={(node) => {
                if (node) tabRefs.current.set(item.value, node);
                else tabRefs.current.delete(item.value);
              }}
              id={tabId(item)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              // Only the selected tab has a panel to point at; the others are not mounted
              aria-controls={isSelected ? panelId : undefined}
              tabIndex={item === tabStop ? 0 : -1}
              disabled={item.isDisabled}
              className={styles.tab}
              onClick={() => choose(item)}
            >
              {item.icon != null && item.icon !== false && (
                <OptionIcon className={styles.icon}>{item.icon}</OptionIcon>
              )}
              {item.label}
            </button>
          );
        })}
      </div>
      {selected && (
        <div
          // Remounted per tab, so the state of one panel is not carried into the next
          key={selected.value}
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId(selected)}
          // Reachable by Tab, so a panel with nothing focusable in it can still be read by keyboard (APG)
          tabIndex={0}
          className={styles.panel}
        >
          {selected.content}
        </div>
      )}
    </div>
  );
});
