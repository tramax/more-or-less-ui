import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { clsx } from '@/utils/clsx';
import { useOverlay } from '../_shared/useOverlay';
import { useTriggerRef, type TriggerProps } from '../_shared/useTriggerRef';
import { overlayClass, type OverlayAlign, type OverlayPlacement } from '../_shared/Overlay';
import styles from './Popover.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const POPOVER_DEFAULTS = {
  placement: 'bottom',
  align: 'center',
} as const;

type PopoverName = { 'aria-label': string } | { 'aria-labelledby': string };

export type PopoverProps = PopoverName & {
  /**
   * What opens it: one element that takes a `ref`, `style` and `onClick` (a Button, a native element).
   * The popover adds to it, and wraps nothing around it.
   */
  trigger: ReactElement;
  /** What it holds: text, a form, buttons. Unlike a Tooltip's, it may be pressed and tabbed into. */
  children: ReactNode;
  /** Below the trigger, or above it. It flips to the other side when there is no room. Default `bottom`. */
  placement?: OverlayPlacement;
  /**
   * Which edge of the trigger it lines up with: `start` (its start edge on the trigger's), `end`, or
   * `center` on it. Logical, so it follows the writing direction. Default `center`.
   */
  align?: OverlayAlign;
  /** Controlled: whether it is open. Pair it with `onOpenChange`. */
  isOpen?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultIsOpen?: boolean;
  /** Called with the new state when the trigger, Escape or a press or focus outside changes it. */
  onOpenChange?: (isOpen: boolean) => void;
  /**
   * On the panel, for what a consumer may set on it: `--popover-max-height` (default `24em`, past which
   * it scrolls). The look is the Popover's.
   */
  className?: string;
};

/**
 * A panel of content opened from a trigger, for something the person acts on and then leaves: a small
 * form, a few actions, an explanation too long for a Tooltip. It is not modal. The page behind it
 * stays live, and it closes on Escape, on a press or focus outside it, and when the trigger is pressed
 * again. It needs a name (`aria-label` or `aria-labelledby`), as any dialog does.
 *
 * Opening it from the trigger moves focus into it; closing it with focus inside puts focus back on the
 * trigger (not after a press elsewhere: focus goes where that press went). Built on `useOverlay`, as
 * Select's popup and Tooltip are: it turns on the outside-click and focus-return options they leave off.
 */
export function Popover({
  trigger,
  children,
  placement = POPOVER_DEFAULTS.placement,
  align = POPOVER_DEFAULTS.align,
  isOpen,
  defaultIsOpen,
  onOpenChange,
  className,
  ...name
}: PopoverProps) {
  const overlay = useOverlay({
    isEscapeClosing: true,
    isOutsideClosing: true,
    isFocusReturned: true,
    isOpen,
    defaultIsOpen,
    onOpenChange,
  });
  const id = useId();
  const triggerProps = trigger.props as TriggerProps;
  const setRef = useTriggerRef(trigger, overlay.anchorRef);

  // Set by the trigger's press, read once it is open: a popover that starts open, or that a caller
  // opens, doesn't take focus from wherever the person is
  const isFocusWanted = useRef(false);
  useEffect(() => {
    if (!overlay.isOpen || !isFocusWanted.current) return;
    isFocusWanted.current = false;
    // After useOverlay's own effect has shown it: a popover that isn't showing can't take focus
    overlay.overlayRef.current?.focus();
  }, [overlay.isOpen, overlay.overlayRef]);

  return (
    <>
      {cloneElement(
        trigger as ReactElement<TriggerProps>,
        {
          ref: setRef,
          style: { ...triggerProps.style, ...overlay.anchorStyle },
          'aria-haspopup': 'dialog',
          'aria-expanded': overlay.isOpen,
          'aria-controls': overlay.isOpen ? id : undefined,
          onClick: (event: MouseEvent<HTMLElement>) => {
            triggerProps.onClick?.(event);
            if (event.defaultPrevented) return;
            isFocusWanted.current = !overlay.isOpen;
            overlay.toggle();
          },
        } as Partial<TriggerProps>,
      )}
      {overlay.isPresent && (
        <div
          {...overlay.overlayProps}
          {...name}
          id={id}
          role="dialog"
          // Focusable by script, not by Tab: it is where focus lands, then Tab goes on into the content
          tabIndex={-1}
          className={clsx(overlayClass(placement, align), styles.popover, className)}
        >
          {children}
        </div>
      )}
    </>
  );
}
