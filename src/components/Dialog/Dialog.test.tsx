import { createRef, useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from './Dialog';
import { Popover } from '../Popover';
import overlayStyles from '../_shared/Overlay.module.css';

const renderDialog = (props: Partial<Parameters<typeof Dialog>[0]> = {}) =>
  render(
    <>
      <Dialog title="Rename file" trigger={<button type="button">Rename</button>} {...props}>
        <button type="button">Save</button>
      </Dialog>
      <button type="button">Elsewhere</button>
    </>,
  );

const trigger = () => screen.getByRole('button', { name: 'Rename' });
// jsdom has no showModal, so the <dialog> is never `open` and is hidden from the role queries
const dialog = () => document.querySelector('dialog');
const inside = () => screen.getByRole('button', { name: 'Save', hidden: true });

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
});

describe('Dialog', () => {
  describe('opening and closing', () => {
    it('is closed until the trigger is pressed', () => {
      renderDialog();
      expect(dialog()).toBeNull();
      fireEvent.click(trigger());
      expect(dialog()?.dataset.state).toBe('open');
      expect(dialog()?.textContent).toContain('Save');
    });

    it('does not close when the trigger is pressed again: the page behind it is inert', () => {
      renderDialog();
      fireEvent.click(trigger());
      fireEvent.click(trigger());
      expect(dialog()?.dataset.state).toBe('open');
    });

    it('can start open', () => {
      renderDialog({ defaultIsOpen: true });
      expect(dialog()?.dataset.state).toBe('open');
    });

    it('closes on Escape, and removes itself after its exit animation', () => {
      vi.useFakeTimers();
      renderDialog();
      fireEvent.click(trigger());
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(dialog()?.dataset.state).toBe('closed');
      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(dialog()).toBeNull();
    });

    it('is shown as a modal, and the browser’s own Escape does not close it behind our back', () => {
      const showModal = vi.fn();
      Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
        configurable: true,
        value: showModal,
      });
      renderDialog();
      fireEvent.click(trigger());
      expect(showModal).toHaveBeenCalledTimes(1);
      expect(dialog()?.hasAttribute('popover')).toBe(false);
      const cancel = new Event('cancel', { cancelable: true });
      dialog()?.dispatchEvent(cancel);
      expect(cancel.defaultPrevented).toBe(true);
    });

    it('does not open when the trigger’s own click handler prevents it', () => {
      renderDialog({
        trigger: (
          <button type="button" onClick={(event) => event.preventDefault()}>
            Rename
          </button>
        ),
      });
      fireEvent.click(trigger());
      expect(dialog()).toBeNull();
    });

    it('opens from state, with no trigger', () => {
      render(
        <Dialog title="Delete" isOpen>
          Sure?
        </Dialog>,
      );
      expect(dialog()?.dataset.state).toBe('open');
    });
  });

  describe('backdrop', () => {
    it('closes on a press that starts and ends on the backdrop, which is the dialog itself', () => {
      renderDialog();
      fireEvent.click(trigger());
      fireEvent.pointerDown(dialog()!);
      fireEvent.click(dialog()!);
      expect(dialog()?.dataset.state).toBe('closed');
    });

    it('stays open for a press on the content', () => {
      renderDialog();
      fireEvent.click(trigger());
      fireEvent.pointerDown(inside());
      fireEvent.click(inside());
      expect(dialog()?.dataset.state).toBe('open');
    });

    it('stays open when a press starts on the content and ends on the backdrop (a text selection)', () => {
      renderDialog();
      fireEvent.click(trigger());
      fireEvent.pointerDown(inside());
      fireEvent.click(dialog()!);
      expect(dialog()?.dataset.state).toBe('open');
    });

    it('can be told not to close, and Escape still closes it', () => {
      renderDialog({ isBackdropClosing: false });
      fireEvent.click(trigger());
      fireEvent.pointerDown(dialog()!);
      fireEvent.click(dialog()!);
      expect(dialog()?.dataset.state).toBe('open');
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(dialog()?.dataset.state).toBe('closed');
    });
  });

  describe('controlled', () => {
    function Controlled({ onOpenChange }: { onOpenChange: (isOpen: boolean) => void }) {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <Dialog
          title="Rename file"
          isOpen={isOpen}
          onOpenChange={(next) => {
            onOpenChange(next);
            setIsOpen(next);
          }}
          trigger={<button type="button">Rename</button>}
          actions={
            <button type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
          }
        >
          Body
        </Dialog>
      );
    }

    it('reports each change, and lets the actions close it', () => {
      const onOpenChange = vi.fn();
      render(<Controlled onOpenChange={onOpenChange} />);
      fireEvent.click(trigger());
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(dialog()?.dataset.state).toBe('open');
      fireEvent.click(screen.getByRole('button', { name: 'Cancel', hidden: true }));
      expect(dialog()?.dataset.state).toBe('closed');
    });

    it('stays as it is when the caller does not follow', () => {
      const onOpenChange = vi.fn();
      renderDialog({ isOpen: false, onOpenChange });
      fireEvent.click(trigger());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(dialog()).toBeNull();
    });
  });

  describe('focus', () => {
    it('goes back to the trigger once it is gone, not while it leaves', () => {
      vi.useFakeTimers();
      renderDialog();
      act(() => trigger().focus());
      fireEvent.click(trigger());
      act(() => inside().focus());
      fireEvent.keyDown(document.body, { key: 'Escape' });
      // The page is still inert while it leaves, and an inert trigger can't take focus
      expect(document.activeElement).toBe(inside());
      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(document.activeElement).toBe(trigger());
    });

    it('goes back to what had focus before when it has no trigger', () => {
      vi.useFakeTimers();
      function Opener() {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <>
            <button type="button" onClick={() => setIsOpen(true)}>
              Delete
            </button>
            <Dialog title="Delete" isOpen={isOpen} onOpenChange={setIsOpen}>
              <button type="button">Save</button>
            </Dialog>
          </>
        );
      }
      render(<Opener />);
      const opener = screen.getByRole('button', { name: 'Delete' });
      act(() => opener.focus());
      fireEvent.click(opener);
      act(() => inside().focus());
      fireEvent.keyDown(document.body, { key: 'Escape' });
      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(document.activeElement).toBe(opener);
    });
  });

  describe('Escape with another overlay open inside', () => {
    it('closes the one on top, and the dialog on the next press', () => {
      render(
        <Dialog title="Rename file" defaultIsOpen>
          <Popover aria-label="Hint" trigger={<button type="button">Hint</button>}>
            Why
          </Popover>
        </Dialog>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Hint', hidden: true }));
      const dialogs = () => screen.getAllByRole('dialog', { hidden: true });
      expect(dialogs()).toHaveLength(2);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(dialogs()[0]?.dataset.state).toBe('open');
      expect(dialogs()[1]?.dataset.state).toBe('closed');
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(dialogs()[0]?.dataset.state).toBe('closed');
    });

    it('leaves the dialog open when a control inside used the key', () => {
      render(
        <Dialog title="Rename file" defaultIsOpen>
          <input aria-label="Name" onKeyDown={(event) => event.preventDefault()} />
        </Dialog>,
      );
      fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'Escape' });
      expect(dialog()?.dataset.state).toBe('open');
    });
  });

  describe('trigger', () => {
    it('reports the dialog and whether it is open', () => {
      renderDialog();
      expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(trigger().getAttribute('aria-controls')).toBeNull();
      fireEvent.click(trigger());
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      expect(trigger().getAttribute('aria-controls')).toBe(dialog()?.id);
    });

    it('keeps the trigger’s own handlers, style and ref', () => {
      const onClick = vi.fn();
      const ref = createRef<HTMLButtonElement>();
      renderDialog({
        trigger: (
          <button type="button" ref={ref} onClick={onClick} style={{ color: 'red' }}>
            Rename
          </button>
        ),
      });
      fireEvent.click(trigger());
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(ref.current).toBe(trigger());
      expect(trigger().style.color).toBe('red');
    });
  });

  describe('dialog', () => {
    const has = (name: string) =>
      dialog()?.classList.contains(
        (overlayStyles as Record<string, string | undefined>)[name] ?? '',
      );

    it('is a modal dialog on the overlay, centred rather than anchored', () => {
      renderDialog({ defaultIsOpen: true });
      expect(dialog()?.getAttribute('role')).toBe('dialog');
      expect(dialog()?.getAttribute('aria-modal')).toBe('true');
      expect(has('overlay')).toBe(true);
      expect(has('modal')).toBe(true);
      expect(has('anchored')).toBe(false);
    });

    it('is named by its title, which is a heading', () => {
      renderDialog({ defaultIsOpen: true });
      const heading = screen.getByRole('heading', { name: 'Rename file', hidden: true });
      expect(dialog()?.getAttribute('aria-labelledby')).toBe(heading.id);
      expect(dialog()?.hasAttribute('aria-label')).toBe(false);
    });

    it('can be named without a visible title', () => {
      render(
        <>
          <h3 id="heading">Terms</h3>
          <Dialog aria-labelledby="heading" defaultIsOpen>
            Text
          </Dialog>
          <Dialog aria-label="Cookies" defaultIsOpen>
            Text
          </Dialog>
        </>,
      );
      const [first, second] = screen.getAllByRole('dialog', { hidden: true });
      expect(first?.getAttribute('aria-labelledby')).toBe('heading');
      expect(second?.getAttribute('aria-label')).toBe('Cookies');
      expect(screen.queryByRole('heading', { level: 2, hidden: true })).toBeNull();
    });

    it('can be described by another element', () => {
      render(
        <Dialog title="Delete" aria-describedby="why" defaultIsOpen>
          <p id="why">This cannot be undone.</p>
        </Dialog>,
      );
      expect(dialog()?.getAttribute('aria-describedby')).toBe('why');
    });

    it('puts the actions after the content', () => {
      renderDialog({ defaultIsOpen: true, actions: <button type="button">Done</button> });
      const buttons = screen.getAllByRole('button', { hidden: true }).map((b) => b.textContent);
      expect(buttons.slice(-3)).toEqual(['Save', 'Done', 'Elsewhere']);
    });
  });
});
