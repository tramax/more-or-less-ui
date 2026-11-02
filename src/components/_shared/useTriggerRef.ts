import { useCallback, version, type ReactElement, type Ref } from 'react';

/**
 * The ref of a trigger element that an overlay component clones (Tooltip, Popover), composed with the
 * overlay's `anchorRef`. The result goes on the clone as its `ref`, so the trigger's own ref still
 * gets the node.
 */
export function useTriggerRef(
  trigger: ReactElement,
  anchorRef: (node: HTMLElement | null) => void,
): (node: HTMLElement | null) => void {
  // React 18 keeps `ref` on the element, 19 in its props (and warns when 18's way is read there)
  const triggerRef: Ref<HTMLElement> | undefined =
    Number.parseInt(version, 10) >= 19
      ? (trigger.props as { ref?: Ref<HTMLElement> }).ref
      : (trigger as ReactElement & { ref?: Ref<HTMLElement> }).ref;

  return useCallback(
    (node: HTMLElement | null) => {
      anchorRef(node);
      if (typeof triggerRef === 'function') triggerRef(node);
      else if (triggerRef) (triggerRef as { current: HTMLElement | null }).current = node;
    },
    [anchorRef, triggerRef],
  );
}
