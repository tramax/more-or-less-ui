import { useEffect, useRef, type ReactNode } from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { CloseButton } from '../_shared/CloseButton';
import { floatingClass, type OverlayPlacement } from '../_shared/Overlay';
import sizes from '../_shared/Size.module.css';
import { usePresence } from '../_shared/usePresence';
import styles from './Toast.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const TOAST_SIZE_DEFAULTS = { size: 'normal' } as const;

// A little longer than the exit animation in Toast.module.css (250ms), which is slower than an
// overlay's: a toast fades out on its own, in view, and a quick fade reads as a cut
const EXIT_MS = 300;

const SCALE_SPEC = {
  // Empty on purpose: without it `resolveScaleProps` can't tell the other props from scale props
  direct: [],
  // `size` sets font-size only: the padding and the gaps are in em (see Toast.module.css), so they
  // follow it. Its classes are _shared/Size.module.css, since `size` is the only scale prop.
  compound: { size: ['fontSize'] },
  defaults: TOAST_SIZE_DEFAULTS,
} as const;

/** What can change about a toast after it is added. */
export type ToastChanges = {
  /** A short headline above the message, in heavier type. */
  title?: string;
  /** The message: any content. */
  description?: ReactNode;
  /**
   * A Button or a link, under the message. A toast with one stays until dismissed (`duration` 0), unless
   * `duration` says otherwise: a message the person may need to act on must not vanish under the pointer.
   */
  action?: ReactNode;
  /** The font size, which the padding and the gaps follow: `less` / `normal` / `more`, or any CSS size. */
  size?: ScaleProp;
  /**
   * How long it stays, in ms, from when it shows. `0` = until dismissed. Default is the provider's, or 0
   * with an `action`. It pauses while the pointer or focus is on the toasts, and while the tab is hidden.
   */
  duration?: number;
  /** How it is announced: `low` politely (default), `high` at once, for an error. */
  priority?: 'low' | 'high';
  /** Called once it is gone, whoever closed it. */
  onClose?: () => void;
};

export type ToastOptions = ToastChanges & {
  /**
   * An id to refer to it by (`update`, `close`). Adding a toast whose id is already there updates that
   * one in place and starts its time again, instead of stacking a copy.
   */
  id?: string;
} & ({ title: string } | { description: NonNullable<ReactNode> });

/** A toast in the provider's list. */
export interface ToastEntry {
  id: string;
  options: ToastChanges;
  /** Counts the updates; announcing and the timer start again when it changes */
  revision: number;
  /** False while it leaves: still on screen for its exit animation */
  isOpen: boolean;
}

const hasContent = (node: ReactNode) => node != null && typeof node !== 'boolean' && node !== '';

export interface ToastViewProps {
  entry: ToastEntry;
  /** Which edge of the viewport the toasts sit against: the one it grows out of */
  placement: OverlayPlacement;
  /** The × was pressed */
  onClose: (id: string) => void;
  /** Its exit animation is over: remove it from the list */
  onExited: (id: string) => void;
  announce: (id: string, revision: number, priority: 'low' | 'high', text: string) => void;
}

/**
 * One toast: a floating overlay surface (the frosted glass of `Overlay.module.css`, as Popover's) with a
 * title, a message, an action under it and a × beside it, kept mounted for its exit animation. It is
 * not a live region: the provider's announcer says it once, and a live region inserted with its text
 * is announced unreliably. Everything about when it comes and goes is the provider's.
 */
export function ToastView({ entry, placement, onClose, onExited, announce }: ToastViewProps) {
  const { id, options, revision, isOpen } = entry;
  const { title, description, action, priority } = options;
  const isPresent = usePresence(isOpen, EXIT_MS);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const { classNames, style } = resolveScaleProps(sizes, SCALE_SPEC, { size: options.size });

  useEffect(() => {
    if (!isPresent) onExited(id);
  }, [isPresent, id, onExited]);

  // Said once per revision, wherever the viewport is rendered: it remounts when it moves into a modal
  useEffect(() => {
    if (!isOpen) return;
    const text = [title, descriptionRef.current?.textContent].filter(Boolean).join('. ');
    announce(id, revision, priority ?? 'low', text);
  }, [isOpen, id, revision, title, priority, announce]);

  return (
    <div
      role="group"
      className={clsx(floatingClass, styles.toast)}
      data-state={isOpen ? 'open' : 'closed'}
      // It grows out of the edge it sits against: above the bottom edge, below the top one
      data-side={placement === 'bottom' ? 'top' : 'bottom'}
      // Leaving: still on screen for its exit animation, but no longer there for anyone else
      aria-hidden={!isOpen || undefined}
    >
      {/* The font size is here, not on the surface: the overlay's `font: inherit` would fight it */}
      <div className={clsx(styles.content, classNames)} style={style}>
        <div className={styles.body}>
          {title && <p className={styles.title}>{title}</p>}
          {hasContent(description) && (
            <div ref={descriptionRef} className={styles.message}>
              {description}
            </div>
          )}
          {hasContent(action) && <div className={styles.action}>{action}</div>}
        </div>
        <CloseButton className={styles.dismiss} label="Dismiss" onClick={() => onClose(id)} />
      </div>
    </div>
  );
}
