import { createContext, useContext, useEffect, type RefObject } from 'react';

/**
 * What a ToastProvider offers a modal: say "put the toasts in this element", and get back a function that
 * takes them out again. The topmost registered element is where the provider shows them.
 */
export type ToastHostRegistry = (element: HTMLElement) => () => void;

/** Null without a ToastProvider, so a modal can always call `useToastHost`. */
export const ToastHostContext = createContext<ToastHostRegistry | null>(null);

/**
 * For a modal `<dialog>`: while `isActive`, toasts are shown inside it. Everything outside a modal
 * dialog is inert, so a toast beside it could be neither pressed nor read; one inside it can. Pass
 * `isActive` as false as soon as the modal starts to close, so the toasts are back on the page before
 * the `<dialog>` is removed.
 */
export function useToastHost(ref: RefObject<HTMLElement | null>, isActive: boolean) {
  const register = useContext(ToastHostContext);
  useEffect(() => {
    const element = ref.current;
    if (!register || !isActive || !element) return;
    return register(element);
  }, [register, isActive, ref]);
}
