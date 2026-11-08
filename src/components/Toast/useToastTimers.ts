import { useEffect, useRef } from 'react';

export interface TimedToast {
  id: string;
  /** ms from when it shows; 0 = never */
  duration: number;
  /** Changes when the toast is updated, which starts its time again */
  revision: number;
}

interface Timer {
  revision: number;
  remaining: number;
  startedAt: number;
  handle?: number;
}

/**
 * Calls `onElapsed(id)` when a toast's time is up. `toasts` are the ones on screen. All the timers pause
 * together while `isPaused` and resume with the time that was left. The time lives here, not in each
 * toast, because a toast remounts when the viewport moves into a modal and must not start again.
 */
export function useToastTimers(
  toasts: TimedToast[],
  isPaused: boolean,
  onElapsed: (id: string) => void,
) {
  const timers = useRef(new Map<string, Timer>());
  const toastsRef = useRef(toasts);
  const onElapsedRef = useRef(onElapsed);
  useEffect(() => {
    toastsRef.current = toasts;
    onElapsedRef.current = onElapsed;
  });

  // What the effect depends on: the list is a new array every render
  const key = toasts.map((toast) => `${toast.id}:${toast.revision}:${toast.duration}`).join('|');

  useEffect(() => {
    const map = timers.current;
    const live = toastsRef.current;
    const ids = new Set(live.map((toast) => toast.id));
    for (const id of [...map.keys()]) if (!ids.has(id)) map.delete(id);

    for (const toast of live) {
      if (toast.duration === 0) {
        map.delete(toast.id);
        continue;
      }
      let timer = map.get(toast.id);
      if (!timer || timer.revision !== toast.revision) {
        timer = { revision: toast.revision, remaining: toast.duration, startedAt: 0 };
        map.set(toast.id, timer);
      }
      if (isPaused) continue;
      timer.startedAt = Date.now();
      timer.handle = window.setTimeout(() => onElapsedRef.current(toast.id), timer.remaining);
    }

    // Every run starts all the timers again, so stop them here and keep what was left
    return () => {
      for (const timer of map.values()) {
        if (timer.handle === undefined) continue;
        window.clearTimeout(timer.handle);
        timer.handle = undefined;
        timer.remaining -= Date.now() - timer.startedAt;
      }
    };
  }, [key, isPaused]);
}
