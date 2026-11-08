'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { clsx } from '@/utils/clsx';
import type { OverlayAlign, OverlayPlacement } from '../_shared/Overlay';
import { ToastHostContext } from '../_shared/ToastHost';
import { ToastView, type ToastChanges, type ToastEntry, type ToastOptions } from './Toast';
import { NO_ANNOUNCEMENT, ToastAnnouncer, type Announcement } from './ToastAnnouncer';
import { useReflow } from './useReflow';
import { useToastTimers } from './useToastTimers';
import styles from './Toast.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const TOAST_DEFAULTS = {
  placement: 'bottom',
  align: 'end',
  limit: 3,
  duration: 5000,
} as const;

// How long a message stays in a live region: read out by then, and not left for a screen reader's
// browse mode to find
const ANNOUNCEMENT_MS = 3000;

export interface ToastApi {
  /** Shows a toast, or queues it when `limit` are showing. Returns its id. */
  add: (options: ToastOptions) => string;
  /** Changes a toast that is still open, and starts its time again. */
  update: (id: string, changes: ToastChanges) => void;
  /** Closes a toast: it leaves, or, if it was still waiting, is dropped. */
  close: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Shows toasts from an event handler or async code. Must be used inside a `ToastProvider`. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used within a ToastProvider');
  return api;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Which edge of the viewport the toasts sit against. Default `bottom`. */
  placement?: OverlayPlacement;
  /** Which corner, or the middle. `start` and `end` follow the writing direction. Default `end`. */
  align?: OverlayAlign;
  /** How many show at once; the rest wait their turn. Default 3. */
  limit?: number;
  /** How long a toast stays, in ms; `0` = until dismissed. Default 5000. A toast's own `duration` wins. */
  duration?: number;
}

let nextId = 0;

/**
 * The ids of the open toasts showing: the first ones, oldest first, that fit in `limit`. A toast that is
 * leaving still holds its place until it is gone, so a queued one takes over that place when the exit is
 * over, and the column does not jump up for it and back down. The rest are queued.
 */
const shownIds = (entries: ToastEntry[], limit: number) => {
  const leaving = entries.filter((entry) => !entry.isOpen).length;
  return new Set(
    entries
      .filter((entry) => entry.isOpen)
      .slice(0, Math.max(0, limit - leaving))
      .map((entry) => entry.id),
  );
};

/**
 * Holds the toasts and shows them in one viewport: a popover in the top layer, in a column at a corner.
 * Put it once, near the root; fire toasts with `useToast()`.
 *
 * The list, the queue and the timers are state here, not in the DOM, because the viewport moves: while a
 * modal is open it is rendered inside the modal's `<dialog>` (see `_shared/ToastHost`), since everything
 * outside a modal is inert. The toasts remount when it moves; their time is kept.
 */
export function ToastProvider({
  children,
  placement = TOAST_DEFAULTS.placement,
  align = TOAST_DEFAULTS.align,
  limit = TOAST_DEFAULTS.limit,
  duration = TOAST_DEFAULTS.duration,
}: ToastProviderProps) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);
  // The calls below run from handlers and timers, so they read the latest list from here
  const entriesRef = useRef(entries);
  const limitRef = useRef(limit);
  // Which revision of each toast has been announced
  const announced = useRef(new Map<string, number>());
  useEffect(() => {
    limitRef.current = limit;
  });

  const commit = useCallback((next: ToastEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
  }, []);

  const change = useCallback(
    (id: string, changes: ToastChanges, isRevived = false) => {
      commit(
        entriesRef.current.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                options: { ...entry.options, ...changes },
                revision: entry.revision + 1,
                isOpen: isRevived || entry.isOpen,
              }
            : entry,
        ),
      );
    },
    [commit],
  );

  const remove = useCallback(
    (id: string) => {
      const entry = entriesRef.current.find((e) => e.id === id);
      if (!entry) return;
      announced.current.delete(id);
      commit(entriesRef.current.filter((e) => e.id !== id));
      entry.options.onClose?.();
    },
    [commit],
  );

  const api = useMemo<ToastApi>(
    () => ({
      add: (options) => {
        const { id = `toast-${++nextId}`, ...changes } = options;
        if (entriesRef.current.some((entry) => entry.id === id)) {
          // Even one that is leaving: it comes back, rather than being removed by its own exit
          change(id, changes, true);
        } else {
          commit([...entriesRef.current, { id, options: changes, revision: 0, isOpen: true }]);
        }
        return id;
      },
      update: (id, changes) => {
        if (entriesRef.current.some((entry) => entry.id === id && entry.isOpen))
          change(id, changes);
      },
      close: (id) => {
        const entry = entriesRef.current.find((e) => e.id === id);
        if (!entry?.isOpen) return;
        if (shownIds(entriesRef.current, limitRef.current).has(id)) {
          // Showing: it leaves with an animation, and `ToastView` removes it after
          commit(entriesRef.current.map((e) => (e.id === id ? { ...e, isOpen: false } : e)));
        } else {
          // Still waiting: there is nothing to animate
          remove(id);
        }
      },
    }),
    [change, commit, remove],
  );

  // What is on screen: the showing toasts, and those leaving (a toast is only queued before it shows)
  const shown = shownIds(entries, limit);
  const rendered = entries.filter((entry) => !entry.isOpen || shown.has(entry.id));
  // The newest is nearest the edge, so the order in the DOM, and for Tab, is the order on screen
  const ordered = placement === 'top' ? [...rendered].reverse() : rendered;

  // --- Pausing: the pointer or focus on the toasts, or the tab out of sight
  const [isHeld, setIsHeld] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  useEffect(() => {
    const onChange = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  useToastTimers(
    rendered
      .filter((entry) => entry.isOpen)
      .map((entry) => ({
        id: entry.id,
        revision: entry.revision,
        // A toast with an action is not on a timer: it may need to be acted on
        duration: entry.options.duration ?? (entry.options.action ? 0 : duration),
      })),
    isHeld || isHidden,
    api.close,
  );

  // --- Announcing
  const [polite, setPolite] = useState<Announcement>(NO_ANNOUNCEMENT);
  const [assertive, setAssertive] = useState<Announcement>(NO_ANNOUNCEMENT);
  const announce = useCallback(
    (id: string, revision: number, priority: 'low' | 'high', text: string) => {
      if (announced.current.get(id) === revision) return;
      announced.current.set(id, revision);
      if (!text) return;
      const set = priority === 'high' ? setAssertive : setPolite;
      set((previous) => ({ text, count: previous.count + 1 }));
    },
    [],
  );
  useEffect(() => {
    if (!polite.text && !assertive.text) return;
    const clear = (previous: Announcement) =>
      previous.text ? { ...previous, text: '' } : previous;
    const timer = window.setTimeout(() => {
      setPolite(clear);
      setAssertive(clear);
    }, ANNOUNCEMENT_MS);
    return () => window.clearTimeout(timer);
  }, [polite, assertive]);

  // --- Where it is rendered: inside the topmost open modal, else here
  const [hosts, setHosts] = useState<HTMLElement[]>([]);
  const register = useCallback((element: HTMLElement) => {
    setHosts((previous) => [...previous, element]);
    return () => setHosts((previous) => previous.filter((host) => host !== element));
  }, []);
  const host = hosts[hosts.length - 1];

  const layer = (
    <>
      <ToastAnnouncer polite={polite} assertive={assertive} />
      {ordered.length > 0 && (
        <ToastViewport
          className={clsx(
            styles.viewport,
            placement === 'top' ? styles.top : styles.bottom,
            align === 'start' ? styles.start : align === 'end' ? styles.end : styles.center,
          )}
          onHold={setIsHeld}
        >
          {ordered.map((entry) => (
            <ToastView
              key={entry.id}
              entry={entry}
              placement={placement}
              onClose={api.close}
              onExited={remove}
              announce={announce}
            />
          ))}
        </ToastViewport>
      )}
    </>
  );

  return (
    <ToastContext.Provider value={api}>
      <ToastHostContext.Provider value={register}>
        {children}
        {host ? createPortal(layer, host) : layer}
      </ToastHostContext.Provider>
    </ToastContext.Provider>
  );
}

/**
 * The one element in the top layer that holds every toast. It shows itself when it mounts, which is
 * also when it has moved into a modal. It reports when the pointer or focus is on it, which holds the
 * timers.
 */
function ToastViewport({
  className,
  onHold,
  children,
}: {
  className: string;
  onHold: (isHeld: boolean) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isHeld = isHovered || isFocused;
  useReflow(ref);

  useEffect(() => {
    try {
      // Absent in jsdom and in browsers without the Popover API
      ref.current?.showPopover?.();
    } catch {
      // Already showing
    }
  }, []);

  useEffect(() => {
    onHold(isHeld);
    return () => onHold(false);
  }, [isHeld, onHold]);

  // A toast that had focus and was removed fires no blur, so look again whenever the toasts change
  useEffect(() => {
    if (isFocused && !ref.current?.contains(document.activeElement)) setIsFocused(false);
  });

  return (
    <div
      ref={ref}
      {...({ popover: 'manual' } as const)}
      role="region"
      aria-label="Notifications"
      className={className}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
      }}
    >
      {children}
    </div>
  );
}
