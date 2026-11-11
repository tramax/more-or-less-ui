import { createRef, useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Popover } from './Popover';
import overlayStyles from '../_shared/Overlay.module.css';

const renderPopover = (props: Partial<Parameters<typeof Popover>[0]> = {}) =>
  render(
    <>
      <Popover aria-label="Share" trigger={<button type="button">Share</button>} {...props}>
        <button type="button">Copy link</button>
      </Popover>
      <button type="button">Elsewhere</button>
    </>,
  );

const trigger = () => screen.getByRole('button', { name: 'Share' });
const panel = () => screen.queryByRole('dialog', { hidden: true });
const inside = () => screen.getByRole('button', { name: 'Copy link', hidden: true });
const elsewhere = () => screen.getByRole('button', { name: 'Elsewhere' });

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Popover', () => {
  it('puts a className on the panel, after its own', () => {
    renderPopover({ className: 'mine', defaultIsOpen: true });
    expect(panel()?.classList.contains('mine')).toBe(true);
  });

  describe('opening and closing', () => {
    it('is closed until the trigger is pressed, and then pressing it again closes it', () => {
      renderPopover();
      expect(panel()).toBeNull();
      fireEvent.click(trigger());
      expect(panel()?.dataset.state).toBe('open');
      expect(panel()?.textContent).toBe('Copy link');
      fireEvent.click(trigger());
      expect(panel()?.dataset.state).toBe('closed');
    });

    it('can start open', () => {
      renderPopover({ defaultIsOpen: true });
      expect(panel()?.dataset.state).toBe('open');
    });

    it('closes on Escape', () => {
      renderPopover();
      fireEvent.click(trigger());
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(panel()?.dataset.state).toBe('closed');
    });

    it('closes on a press outside, and not on one inside', () => {
      renderPopover();
      fireEvent.click(trigger());
      fireEvent.pointerDown(inside());
      expect(panel()?.dataset.state).toBe('open');
      fireEvent.pointerDown(elsewhere());
      expect(panel()?.dataset.state).toBe('closed');
    });

    it('closes when focus moves outside', () => {
      renderPopover();
      fireEvent.click(trigger());
      act(() => elsewhere().focus());
      expect(panel()?.dataset.state).toBe('closed');
    });

    it('does not open when the trigger’s own click handler prevents it', () => {
      render(
        <Popover
          aria-label="Share"
          trigger={
            <button type="button" onClick={(event) => event.preventDefault()}>
              Share
            </button>
          }
        >
          Hi
        </Popover>,
      );
      fireEvent.click(trigger());
      expect(panel()).toBeNull();
    });
  });

  describe('controlled', () => {
    function Controlled({ onOpenChange }: { onOpenChange: (isOpen: boolean) => void }) {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <Popover
          aria-label="Share"
          isOpen={isOpen}
          onOpenChange={(next) => {
            onOpenChange(next);
            setIsOpen(next);
          }}
          trigger={<button type="button">Share</button>}
        >
          <button type="button" onClick={() => setIsOpen(false)}>
            Done
          </button>
        </Popover>
      );
    }

    it('reports each change, and lets the content close it', () => {
      const onOpenChange = vi.fn();
      render(<Controlled onOpenChange={onOpenChange} />);
      fireEvent.click(trigger());
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(panel()?.dataset.state).toBe('open');
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(panel()?.dataset.state).toBe('closed');
    });

    it('stays as it is when the caller does not follow', () => {
      const onOpenChange = vi.fn();
      renderPopover({ isOpen: false, onOpenChange });
      fireEvent.click(trigger());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(panel()).toBeNull();
    });
  });

  describe('focus', () => {
    it('moves into the panel when the trigger opens it, and back when Escape closes it', () => {
      renderPopover();
      act(() => trigger().focus());
      fireEvent.click(trigger());
      expect(document.activeElement).toBe(panel());
      act(() => inside().focus());
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(document.activeElement).toBe(trigger());
    });

    it('does not take focus when it starts open', () => {
      renderPopover({ defaultIsOpen: true });
      expect(document.activeElement).toBe(document.body);
    });

    it('does not take focus back after a press elsewhere', () => {
      renderPopover();
      fireEvent.click(trigger());
      act(() => inside().focus());
      fireEvent.pointerDown(elsewhere());
      expect(document.activeElement).not.toBe(trigger());
    });
  });

  describe('trigger', () => {
    it('reports the popup and whether it is open', () => {
      renderPopover();
      expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(trigger().getAttribute('aria-controls')).toBeNull();
      fireEvent.click(trigger());
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      expect(trigger().getAttribute('aria-controls')).toBe(panel()?.id);
    });

    it('keeps the trigger own handlers, style and ref', () => {
      const onClick = vi.fn();
      const ref = createRef<HTMLButtonElement>();
      render(
        <Popover
          aria-label="Share"
          trigger={
            <button type="button" ref={ref} onClick={onClick} style={{ color: 'red' }}>
              Share
            </button>
          }
        >
          Hi
        </Popover>,
      );
      fireEvent.click(trigger());
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(ref.current).toBe(trigger());
      expect(trigger().style.color).toBe('red');
    });
  });

  describe('panel', () => {
    const has = (name: string) =>
      panel()?.classList.contains(
        (overlayStyles as Record<string, string | undefined>)[name] ?? '',
      );

    it('is a named, non-modal dialog on the overlay, below the trigger and centered by default', () => {
      renderPopover();
      fireEvent.click(trigger());
      expect(panel()?.getAttribute('aria-label')).toBe('Share');
      expect(panel()?.getAttribute('aria-modal')).toBeNull();
      expect(has('overlay')).toBe(true);
      expect(has('bottom')).toBe(true);
    });

    it('can be named by another element, and placed above', () => {
      render(
        <>
          <h2 id="title">Share this</h2>
          <Popover
            aria-labelledby="title"
            placement="top"
            trigger={<button type="button">Share</button>}
          >
            Hi
          </Popover>
        </>,
      );
      fireEvent.click(trigger());
      expect(panel()?.getAttribute('aria-labelledby')).toBe('title');
      expect(has('top')).toBe(true);
    });

    it.each([
      ['bottom', 'start', 'bottomStart'],
      ['bottom', 'end', 'bottomEnd'],
      ['top', 'start', 'topStart'],
      ['top', 'end', 'topEnd'],
      ['top', 'center', 'top'],
    ] as const)('%s, aligned %s, takes the %s placement', (placement, align, className) => {
      renderPopover({ placement, align });
      fireEvent.click(trigger());
      expect(has(className)).toBe(true);
      // Exactly one placement class
      const placements = ['top', 'topStart', 'topEnd', 'bottom', 'bottomStart', 'bottomEnd'];
      expect(placements.filter(has)).toEqual([className]);
    });
  });
});
