import { useState } from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from '../Dialog';
import { ToastProvider, useToast, type ToastApi, type ToastProviderProps } from './ToastProvider';
import type { ToastOptions } from './Toast';
import overlayStyles from '../_shared/Overlay.module.css';
import sizes from '../_shared/Size.module.css';
import styles from './Toast.module.css';

let api: ToastApi;
function Capture() {
  api = useToast();
  return null;
}

const setup = (props: Omit<ToastProviderProps, 'children'> = {}) =>
  render(
    <ToastProvider {...props}>
      <Capture />
    </ToastProvider>,
  );

const fire = (options: ToastOptions) => {
  let id = '';
  act(() => {
    id = api.add(options);
  });
  return id;
};
const run = (fn: () => void) => act(fn);
const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

// A toast stays mounted for 300ms after it closes, for its exit animation
const EXIT = 350;

const toasts = () => [...document.querySelectorAll<HTMLElement>('[role="group"]')];
const states = () => toasts().map((el) => el.dataset.state);
const titles = () => toasts().map((el) => el.querySelector('p')?.textContent);
const viewport = () => document.querySelector<HTMLElement>('[aria-label="Notifications"]');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete (document as { hidden?: boolean }).hidden;
});

describe('ToastProvider', () => {
  it('has no viewport until a toast is fired', () => {
    setup();
    expect(viewport()).toBeNull();
    fire({ title: 'Saved' });
    expect(viewport()?.getAttribute('role')).toBe('region');
  });

  it('shows itself in the top layer', () => {
    const showPopover = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      value: showPopover,
    });
    try {
      setup();
      fire({ title: 'Saved' });
      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(viewport()?.getAttribute('popover')).toBe('manual');
    } finally {
      delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
    }
  });

  it('throws from useToast outside a provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Capture />)).toThrow(/ToastProvider/);
    error.mockRestore();
  });

  describe('a toast', () => {
    it('shows its title, message and a dismiss button, as a group and not a live region', () => {
      setup();
      fire({ title: 'Saved', description: 'Draft 3 is up to date' });
      const [toast] = toasts();
      expect(toast?.textContent).toContain('Saved');
      expect(toast?.textContent).toContain('Draft 3 is up to date');
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
      // Only the announcer is a status: a second one would say it twice
      expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    it('is an overlay surface: the overlay’s classes and the toast’s own', () => {
      setup();
      fire({ title: 'Saved' });
      const toast = toasts()[0];
      expect(toast?.classList.contains(overlayStyles.overlay as string)).toBe(true);
      expect(toast?.classList.contains(styles.toast as string)).toBe(true);
      // Not anchored or modal: the viewport places it
      expect(toast?.classList.contains(overlayStyles.anchored as string)).toBe(false);
      expect(toast?.classList.contains(overlayStyles.modal as string)).toBe(false);
    });

    it('takes size from the shared scale, on the content and not on the surface', () => {
      setup();
      fire({ id: 'a', title: 'Default' });
      fire({ id: 'b', title: 'More', size: 'more' });
      fire({ id: 'c', title: 'Custom', size: '1.5rem' });
      const [a, b, c] = toasts().map((el) => el.querySelector<HTMLElement>(`.${styles.content}`));
      expect(a?.classList.contains(sizes.sizeNormal as string)).toBe(true);
      expect(b?.classList.contains(sizes.sizeMore as string)).toBe(true);
      expect(c?.style.fontSize).toBe('1.5rem');
      expect(c?.classList.contains(sizes.sizeNormal as string)).toBe(false);
      // The overlay's `font: inherit` is on the surface, so the size must not be
      for (const toast of toasts()) {
        expect(toast.className).not.toMatch(/size/);
        expect(toast.getAttribute('style')).toBeFalsy();
      }
    });

    it('renders an action under the message', () => {
      setup();
      fire({ description: 'Deleted', action: <button type="button">Undo</button> });
      expect(screen.getByRole('button', { name: 'Undo' }).parentElement?.className).toBe(
        styles.action,
      );
    });

    it('leaves when dismissed, then is removed, and calls onClose once', () => {
      const onClose = vi.fn();
      setup();
      fire({ title: 'Saved', onClose });
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
      expect(states()).toEqual(['closed']);
      expect(toasts()[0]?.getAttribute('aria-hidden')).toBe('true');
      expect(onClose).not.toHaveBeenCalled();
      wait(EXIT);
      expect(toasts()).toHaveLength(0);
      expect(viewport()).toBeNull();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('comes back when it is added again while it leaves', () => {
      const onClose = vi.fn();
      setup();
      const id = fire({ id: 'a', title: 'Saved', onClose });
      run(() => api.close(id));
      fire({ id: 'a', title: 'Saved again' });
      wait(500);
      expect(states()).toEqual(['open']);
      expect(titles()).toEqual(['Saved again']);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('updates in place when the id is already there, and when update is called', () => {
      setup();
      fire({ id: 'a', title: 'Saving' });
      fire({ id: 'a', title: 'Saved', description: 'Done' });
      expect(titles()).toEqual(['Saved']);
      run(() => api.update('a', { description: 'Really done' }));
      expect(toasts()).toHaveLength(1);
      expect(toasts()[0]?.textContent).toContain('Really done');
    });

    it('ignores update and close for an id that is not there', () => {
      setup();
      run(() => {
        api.update('nope', { title: 'x' });
        api.close('nope');
      });
      expect(viewport()).toBeNull();
    });
  });

  describe('time', () => {
    it('closes after 5000 ms by default', () => {
      setup();
      fire({ title: 'Saved' });
      wait(4999);
      expect(states()).toEqual(['open']);
      wait(1);
      expect(states()).toEqual(['closed']);
    });

    it('takes the provider’s duration, and a toast’s own wins', () => {
      setup({ duration: 1000 });
      fire({ id: 'a', title: 'Short' });
      fire({ id: 'b', title: 'Long', duration: 3000 });
      wait(1000);
      expect(states()).toEqual(['closed', 'open']);
      // The short one has left and been removed by now
      wait(2000);
      expect(states()).toEqual(['closed']);
    });

    it('stays until dismissed with duration 0', () => {
      setup();
      fire({ title: 'Stays', duration: 0 });
      wait(60_000);
      expect(states()).toEqual(['open']);
    });

    it('stays until dismissed when it has an action, unless duration says otherwise', () => {
      setup();
      fire({ id: 'a', description: 'Deleted', action: <button type="button">Undo</button> });
      fire({
        id: 'b',
        description: 'Moved',
        action: <button type="button">Undo</button>,
        duration: 2000,
      });
      wait(10_000);
      expect(states()).toEqual(['open', 'closed']);
    });

    it('starts its time again when it is updated', () => {
      setup();
      fire({ id: 'a', title: 'Saving' });
      wait(4000);
      run(() => api.update('a', { title: 'Saved' }));
      wait(4000);
      expect(states()).toEqual(['open']);
      wait(1000);
      expect(states()).toEqual(['closed']);
    });

    it('pauses while the pointer is over the toasts, and resumes with the time that was left', () => {
      setup();
      fire({ title: 'Saved' });
      wait(3000);
      fireEvent.pointerEnter(viewport()!);
      wait(60_000);
      expect(states()).toEqual(['open']);
      fireEvent.pointerLeave(viewport()!);
      wait(1999);
      expect(states()).toEqual(['open']);
      wait(1);
      expect(states()).toEqual(['closed']);
    });

    it('pauses while focus is inside a toast', () => {
      setup();
      fire({ title: 'Saved' });
      wait(3000);
      const button = screen.getByRole('button', { name: 'Dismiss' });
      act(() => button.focus());
      wait(60_000);
      expect(states()).toEqual(['open']);
      act(() => button.blur());
      wait(2000);
      expect(states()).toEqual(['closed']);
    });

    it('pauses while the tab is hidden', () => {
      setup();
      fire({ title: 'Saved' });
      wait(3000);
      const setHidden = (hidden: boolean) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
        act(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
      };
      setHidden(true);
      wait(60_000);
      expect(states()).toEqual(['open']);
      setHidden(false);
      wait(2000);
      expect(states()).toEqual(['closed']);
    });

    it('is not held by a pointer or focus that went away with the last toast', () => {
      setup();
      fire({ id: 'a', title: 'First' });
      fireEvent.pointerEnter(viewport()!);
      run(() => api.close('a'));
      wait(EXIT);
      expect(viewport()).toBeNull();
      fire({ id: 'b', title: 'Second' });
      wait(5000);
      expect(states()).toEqual(['closed']);
    });
  });

  describe('stack', () => {
    it('shows at most `limit` and queues the rest, unmounted', () => {
      setup({ limit: 2 });
      fire({ id: 'a', title: 'A' });
      fire({ id: 'b', title: 'B' });
      fire({ id: 'c', title: 'C' });
      expect(titles()).toEqual(['A', 'B']);
    });

    it('shows a queued toast when the place of the one that left is free, and starts its time then', () => {
      setup({ limit: 1 });
      fire({ id: 'a', title: 'A' });
      fire({ id: 'b', title: 'B' });
      wait(5000);
      // A is leaving and still holds its place: B does not push in beside it
      expect(titles()).toEqual(['A']);
      expect(states()).toEqual(['closed']);
      wait(EXIT);
      expect(titles()).toEqual(['B']);
      expect(states()).toEqual(['open']);
      wait(4999);
      expect(states()).toEqual(['open']);
      wait(1);
      expect(states()).toEqual(['closed']);
    });

    it('never shows more than `limit` at once, leaving ones included', () => {
      setup({ limit: 2 });
      for (const id of ['a', 'b', 'c', 'd']) fire({ id, title: id.toUpperCase() });
      const most = { n: toasts().length };
      run(() => api.close('a'));
      most.n = Math.max(most.n, toasts().length);
      wait(EXIT);
      most.n = Math.max(most.n, toasts().length);
      expect(most.n).toBe(2);
      expect(titles()).toEqual(['B', 'C']);
    });

    it('drops a queued toast at once when it is closed, and calls its onClose', () => {
      const onClose = vi.fn();
      setup({ limit: 1 });
      fire({ id: 'a', title: 'A' });
      fire({ id: 'b', title: 'B', onClose });
      run(() => api.close('b'));
      expect(onClose).toHaveBeenCalledTimes(1);
      run(() => api.close('a'));
      wait(EXIT);
      expect(viewport()).toBeNull();
    });

    it('can update a queued toast', () => {
      setup({ limit: 1 });
      fire({ id: 'a', title: 'A' });
      fire({ id: 'b', title: 'B' });
      run(() => api.update('b', { title: 'B2' }));
      run(() => api.close('a'));
      wait(EXIT);
      expect(titles()).toEqual(['B2']);
    });

    it('puts the newest nearest the edge, in DOM order too', () => {
      const { unmount } = setup({ placement: 'bottom' });
      fire({ id: 'a', title: 'A' });
      fire({ id: 'b', title: 'B' });
      expect(titles()).toEqual(['A', 'B']);
      expect(viewport()?.classList.contains(styles.bottom as string)).toBe(true);
      unmount();

      setup({ placement: 'top' });
      fire({ id: 'a', title: 'A' });
      fire({ id: 'b', title: 'B' });
      expect(titles()).toEqual(['B', 'A']);
      expect(viewport()?.classList.contains(styles.top as string)).toBe(true);
    });

    it('grows out of the edge it sits against', () => {
      const { unmount } = setup({ placement: 'bottom' });
      fire({ title: 'Saved' });
      // Above its edge, as an overlay that flipped above its anchor
      expect(toasts()[0]?.dataset.side).toBe('top');
      unmount();

      setup({ placement: 'top' });
      fire({ title: 'Saved' });
      expect(toasts()[0]?.dataset.side).toBe('bottom');
    });

    it.each([
      ['start', 'start'],
      ['center', 'center'],
      ['end', 'end'],
    ] as const)('aligns to the %s', (align, className) => {
      setup({ align });
      fire({ title: 'Saved' });
      expect(viewport()?.classList.contains(styles[className] as string)).toBe(true);
    });
  });

  describe('announcing', () => {
    it('says a toast once, politely by default, and clears it later', () => {
      setup();
      fire({ title: 'Saved', description: 'Draft 3' });
      expect(screen.getByRole('status').textContent).toBe('Saved. Draft 3');
      expect(screen.getByRole('alert').textContent).toBe('');
      wait(3000);
      expect(screen.getByRole('status').textContent).toBe('');
    });

    it('says a high-priority toast in the assertive region', () => {
      setup();
      fire({ description: 'Upload failed', priority: 'high' });
      expect(screen.getByRole('alert').textContent).toBe('Upload failed');
      expect(screen.getByRole('status').textContent).toBe('');
    });

    it('says an update again, and a toast waiting in the queue only when it shows', () => {
      setup({ limit: 1 });
      fire({ id: 'a', title: 'Saving' });
      fire({ id: 'b', title: 'Queued' });
      expect(screen.getByRole('status').textContent).toBe('Saving');
      run(() => api.update('a', { title: 'Saved' }));
      expect(screen.getByRole('status').textContent).toBe('Saved');
      run(() => api.close('a'));
      wait(EXIT);
      expect(screen.getByRole('status').textContent).toBe('Queued');
    });
  });

  describe('inside a modal', () => {
    function Harness() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            open
          </button>
          <Dialog title="Rename" isOpen={isOpen} onOpenChange={setIsOpen}>
            <p>content</p>
          </Dialog>
        </>
      );
    }
    const renderWithDialog = () =>
      render(
        <ToastProvider>
          <Capture />
          <Harness />
        </ToastProvider>,
      );
    const openDialog = () => fireEvent.click(screen.getByText('open'));
    const dialog = () => document.querySelector('dialog');
    // jsdom has no showModal, so the <dialog> is never `open` and is hidden from the role queries
    const announcer = () => screen.getByRole('status', { hidden: true });

    it('moves into the open dialog, which is the only place a toast can be used, and back when it closes', () => {
      renderWithDialog();
      fire({ title: 'Saved' });
      expect(dialog()).toBeNull();
      expect(viewport()?.closest('dialog')).toBeNull();

      openDialog();
      expect(dialog()?.contains(viewport())).toBe(true);
      expect(dialog()?.contains(announcer())).toBe(true);

      fireEvent.keyDown(document.body, { key: 'Escape' });
      // Out of the dialog as it starts to leave, while the page is still inert
      expect(dialog()).not.toBeNull();
      expect(dialog()?.contains(viewport())).toBe(false);
      wait(EXIT);
      expect(viewport()).not.toBeNull();
    });

    it('keeps the time a toast had left across the move, and does not say it again', () => {
      renderWithDialog();
      fire({ title: 'Saved' });
      wait(3000);
      openDialog();
      expect(announcer().textContent).toBe('');
      wait(1999);
      expect(states()).toEqual(['open']);
      wait(1);
      expect(states()).toEqual(['closed']);
    });

    it('shows a toast fired while the dialog is open inside it', () => {
      renderWithDialog();
      openDialog();
      fire({ title: 'Saved' });
      expect(dialog()?.contains(viewport())).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss', hidden: true }));
      expect(states()).toEqual(['closed']);
    });
  });
});
