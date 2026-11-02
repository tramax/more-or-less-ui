import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { clsx } from '@/utils/clsx';
import { useOverlay } from '../_shared/useOverlay';
import { useTriggerRef, type TriggerProps } from '../_shared/useTriggerRef';
import { overlayClass, type OverlayAlign, type OverlayPlacement } from '../_shared/Overlay';
import { OptionText } from '../_shared/OptionText';
import { stepEnabled, useTypeahead } from '../_shared/optionNavigation';
import type { OptionBase } from '../_shared/types';
import listStyles from '../_shared/OptionList.module.css';
import styles from './Menu.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const MENU_DEFAULTS = {
  placement: 'bottom',
  align: 'start',
} as const;

export type MenuItem = OptionBase & {
  /**
   * A glyph before the label. Decorative, so it is hidden from assistive tech and `label` stays the
   * name. It fills a 1.25em square, as a Select option's does.
   */
  icon?: ReactNode;
};

export type MenuProps = {
  /**
   * What opens it: one element that takes a `ref`, `style`, `id`, `onClick` and `onKeyDown` (a Button,
   * a native element). The menu adds to it, and wraps nothing around it. It names the menu, so an
   * icon-only trigger needs an `aria-label`.
   */
  trigger: ReactElement;
  /** The actions. A disabled one is dimmed and skipped by the arrow keys. */
  items: MenuItem[];
  /** Called with the `value` of the item that was chosen; the menu then closes. */
  onSelect: (value: string) => void;
  /** Below the trigger, or above it. It flips to the other side when there is no room. Default `bottom`. */
  placement?: OverlayPlacement;
  /**
   * Which edge of the trigger it lines up with: `start` (its start edge on the trigger's), `end`, or
   * `center` on it. Logical, so it follows the writing direction. Default `start`.
   */
  align?: OverlayAlign;
  /** Controlled: whether it is open. Pair it with `onOpenChange`. */
  isOpen?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultIsOpen?: boolean;
  /** Called with the new state when the trigger, Escape, a choice or a press or focus outside changes it. */
  onOpenChange?: (isOpen: boolean) => void;
};

type FocusTarget = 'first' | 'last' | 'menu';

/**
 * A list of actions opened from a trigger (a "more" button, an account button): choose one and the menu
 * closes. For picking a *value* use Select, for a panel of anything use Popover.
 *
 * Follows the WAI-ARIA APG menu button pattern. Focus moves into the menu and stays on its items
 * (`role="menuitem"` buttons): ↑ ↓ Home End move it, typing jumps to a label, Enter or Space chooses,
 * Escape closes and gives focus back to the trigger, Tab closes. On the trigger, ↓ opens it on the
 * first item and ↑ on the last. Built on `useOverlay`, as Popover is, and on Select's list
 * (`OptionList`, `OptionText`, `optionNavigation`).
 */
export function Menu({
  trigger,
  items,
  onSelect,
  placement = MENU_DEFAULTS.placement,
  align = MENU_DEFAULTS.align,
  isOpen,
  defaultIsOpen,
  onOpenChange,
}: MenuProps) {
  const overlay = useOverlay({
    isEscapeClosing: true,
    isOutsideClosing: true,
    isFocusReturned: true,
    isOpen,
    defaultIsOpen,
    onOpenChange,
  });
  const autoId = useId();
  const triggerProps = trigger.props as TriggerProps;
  const triggerId = triggerProps.id ?? `${autoId}-trigger`;
  const menuId = `${autoId}-menu`;
  const itemId = (item: MenuItem) => `${autoId}-item-${items.indexOf(item)}`;
  const setRef = useTriggerRef(trigger, overlay.anchorRef);
  const typeahead = useTypeahead();

  // The focus *is* the active item, so there is no state for it: each row's element is found here
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const focusItem = (item: MenuItem | undefined) =>
    itemRefs.current.get(item?.value ?? '')?.focus();
  const focusedIndex = () =>
    items.findIndex((item) => itemRefs.current.get(item.value) === document.activeElement);

  const focusTarget = (target: FocusTarget) => {
    if (target === 'first') focusItem(stepEnabled(items, -1, 1));
    else if (target === 'last') focusItem(stepEnabled(items, items.length, -1));
    // Also the fallback when there is nothing enabled to land on
    if (target === 'menu' || !items.some((item) => !item.isDisabled)) {
      overlay.overlayRef.current?.focus();
    }
  };

  // Set by the trigger, read once it is open: a menu that starts open, or that a caller opens, doesn't
  // take focus from wherever the person is
  const focusWanted = useRef<FocusTarget | null>(null);
  useEffect(() => {
    if (!overlay.isOpen || !focusWanted.current) return;
    const target = focusWanted.current;
    focusWanted.current = null;
    // After useOverlay's own effect has shown it: a menu that isn't showing can't take focus
    focusTarget(target);
    // `focusTarget` reads refs and `items`, which are as current in this render as in any
  }, [overlay.isOpen]);

  const choose = (item: MenuItem) => {
    if (item.isDisabled) return;
    onSelect(item.value);
    overlay.close();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const { key } = event;
    if (event.ctrlKey || event.metaKey) return;
    const index = focusedIndex();

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      const down = key === 'ArrowDown';
      // From the menu itself (nothing focused yet): an end
      focusItem(
        stepEnabled(items, index === -1 ? (down ? -1 : items.length) : index, down ? 1 : -1),
      );
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      focusTarget(key === 'Home' ? 'first' : 'last');
    } else if (key === 'Tab') {
      // Focus goes on from the trigger, which `isFocusReturned` has put it on
      overlay.close();
    } else if (key.length === 1 && !event.altKey && (key !== ' ' || typeahead.isTyping())) {
      // Type-ahead. A Space with nothing typed is left to the focused button, which chooses it.
      event.preventDefault();
      focusItem(typeahead.match(items, index, key));
    }
  };

  return (
    <>
      {cloneElement(
        trigger as ReactElement<TriggerProps>,
        {
          ref: setRef,
          id: triggerId,
          style: { ...triggerProps.style, ...overlay.anchorStyle },
          'aria-haspopup': 'menu',
          'aria-expanded': overlay.isOpen,
          'aria-controls': overlay.isOpen ? menuId : undefined,
          onClick: (event: MouseEvent<HTMLElement>) => {
            triggerProps.onClick?.(event);
            if (event.defaultPrevented) return;
            // `detail` is 0 for a click the keyboard made (Enter, Space): that lands on the first item.
            // A press lands on the menu, with no item lit under a pointer that isn't on it.
            focusWanted.current = overlay.isOpen ? null : event.detail === 0 ? 'first' : 'menu';
            overlay.toggle();
          },
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            triggerProps.onKeyDown?.(event);
            if (event.defaultPrevented) return;
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            const target = event.key === 'ArrowDown' ? 'first' : 'last';
            if (overlay.isOpen) return focusTarget(target);
            focusWanted.current = target;
            overlay.open();
          },
        } as Partial<TriggerProps>,
      )}
      {overlay.isPresent && (
        <div
          {...overlay.overlayProps}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          // Focusable by script, not by Tab: where focus lands when a press opens it
          tabIndex={-1}
          className={clsx(
            overlayClass(placement, align),
            listStyles.popup,
            listStyles.list,
            styles.menu,
          )}
          onKeyDown={onMenuKeyDown}
        >
          {items.map((item) => {
            const descriptionId = item.description ? `${itemId(item)}-description` : undefined;
            return (
              <button
                key={item.value}
                ref={(node) => {
                  if (node) itemRefs.current.set(item.value, node);
                  else itemRefs.current.delete(item.value);
                }}
                id={itemId(item)}
                type="button"
                role="menuitem"
                // Focus moves among the rows by script; Tab leaves the menu
                tabIndex={-1}
                disabled={item.isDisabled}
                aria-describedby={descriptionId}
                className={clsx(listStyles.option, styles.item)}
                onClick={() => choose(item)}
                onMouseMove={(event) => {
                  // The pointer lights the row it is on, as it does in Select. It is already in view.
                  if (document.activeElement !== event.currentTarget) {
                    event.currentTarget.focus({ preventScroll: true });
                  }
                }}
              >
                <span className={listStyles.optionText}>
                  <OptionText
                    label={item.label}
                    description={item.description}
                    descriptionId={descriptionId}
                    icon={item.icon}
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
