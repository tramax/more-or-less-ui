import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  version,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { clsx } from '@/utils/clsx';
import { useOverlay } from '../_shared/useOverlay';
import overlayStyles from '../_shared/Overlay.module.css';
import styles from './Tooltip.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const TOOLTIP_DEFAULTS = {
  placement: 'top',
  delay: 400,
} as const;

// Long enough to cross the gap between the trigger and the tooltip, which is hoverable
const LEAVE_MS = 100;

type TriggerProps = {
  ref?: Ref<HTMLElement>;
  style?: object;
  'aria-describedby'?: string;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
};

export type TooltipProps = {
  /**
   * What the tooltip is for: one element that takes a `ref`, `style` and pointer and focus handlers (a
   * Button, an Avatar, a native element). The tooltip adds to it, and wraps nothing around it.
   */
  children: ReactElement;
  /** What it says. Describes the trigger, so keep it short and don't put anything pressable in it. */
  content: ReactNode;
  /** Above the trigger, or below it. It flips to the other side when there is no room. Default `top`. */
  placement?: 'top' | 'bottom';
  /** Milliseconds the pointer rests on the trigger before it shows. Keyboard focus shows it at once. Default 400. */
  delay?: number;
  /** Render the trigger alone. */
  isDisabled?: boolean;
};

/**
 * A short description of something, shown while the pointer rests on it or it has keyboard focus, and
 * hidden when either goes, on Escape, or when it is pressed. It describes the trigger (`aria-describedby`)
 * and does not name it: a trigger with no text of its own (an icon button) still needs an `aria-label`.
 *
 * Meant for text, and for nothing that must be reached by touch: a touch screen has no hover, so
 * anything it says has to be somewhere else too. The tooltip can be hovered, so it stays while the
 * pointer moves onto it (WCAG 1.4.13). A disabled button gets no pointer events from the browser, so
 * wrap it, or leave it with its reason shown some other way.
 *
 * Built on `useOverlay`, as Select's popup is.
 */
export function Tooltip({
  children,
  content,
  placement = TOOLTIP_DEFAULTS.placement,
  delay = TOOLTIP_DEFAULTS.delay,
  isDisabled = false,
}: TooltipProps) {
  const overlay = useOverlay({ isEscapeClosing: true });
  const id = useId();
  const timer = useRef(0);
  const stop = () => window.clearTimeout(timer.current);
  useEffect(() => stop, []);

  // One timer for both directions: whichever is wanted last wins
  const showAfter = (ms: number) => {
    stop();
    if (ms <= 0) overlay.open();
    else timer.current = window.setTimeout(overlay.open, ms);
  };
  const hide = () => {
    stop();
    overlay.close();
  };
  const hideSoon = () => {
    stop();
    timer.current = window.setTimeout(overlay.close, LEAVE_MS);
  };

  const trigger = children.props as TriggerProps;
  // React 18 keeps `ref` on the element, 19 in its props (and warns when 18's way is read there)
  const triggerRef =
    Number.parseInt(version, 10) >= 19
      ? trigger.ref
      : (children as ReactElement & { ref?: Ref<HTMLElement> }).ref;
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      overlay.anchorRef(node);
      if (typeof triggerRef === 'function') triggerRef(node);
      else if (triggerRef) (triggerRef as { current: HTMLElement | null }).current = node;
    },
    [overlay.anchorRef, triggerRef],
  );

  if (isDisabled) return children;

  const describedBy = [trigger['aria-describedby'], overlay.isOpen ? id : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {cloneElement(children as ReactElement<TriggerProps>, {
        ref: setRef,
        style: { ...trigger.style, ...overlay.anchorStyle },
        'aria-describedby': describedBy || undefined,
        onPointerEnter: (event) => {
          trigger.onPointerEnter?.(event);
          // A touch has no resting pointer; it arrives with a tap, which is a press
          if (event.pointerType !== 'touch') showAfter(delay);
        },
        onPointerLeave: (event) => {
          trigger.onPointerLeave?.(event);
          hideSoon();
        },
        onPointerDown: (event) => {
          trigger.onPointerDown?.(event);
          hide();
        },
        onFocus: (event) => {
          trigger.onFocus?.(event);
          // Not for a click's focus: that is a press, which hides it
          if (isFocusVisible(event.currentTarget)) showAfter(0);
        },
        onBlur: (event) => {
          trigger.onBlur?.(event);
          hide();
        },
      })}
      {overlay.isPresent && (
        <div
          {...overlay.overlayProps}
          id={id}
          role="tooltip"
          className={clsx(overlayStyles.overlay, styles.tooltip, styles[placement])}
          // Hoverable: moving onto it keeps it
          onPointerEnter={stop}
          onPointerLeave={hideSoon}
        >
          {content}
        </div>
      )}
    </>
  );
}

// jsdom and old browsers throw on :focus-visible; a focus there counts
function isFocusVisible(element: HTMLElement) {
  try {
    return element.matches(':focus-visible');
  } catch {
    return true;
  }
}
