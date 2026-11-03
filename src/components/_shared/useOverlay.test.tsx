import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useOverlay, type UseOverlayOptions } from './useOverlay';

function Probe(options: UseOverlayOptions) {
  const overlay = useOverlay(options);
  return (
    <>
      <button ref={overlay.anchorRef} style={overlay.anchorStyle} onClick={overlay.toggle}>
        anchor
      </button>
      <button onClick={overlay.close}>close</button>
      {overlay.isPresent && (
        <div {...overlay.overlayProps} data-testid="overlay">
          {overlay.isOpen ? 'open' : 'leaving'}
        </div>
      )}
    </>
  );
}

const overlayEl = () => screen.queryByTestId('overlay');

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useOverlay', () => {
  it('renders nothing until it is opened', () => {
    render(<Probe />);
    expect(overlayEl()).toBeNull();
    fireEvent.click(screen.getByText('anchor'));
    expect(overlayEl()?.dataset.state).toBe('open');
    expect(overlayEl()?.getAttribute('popover')).toBe('manual');
  });

  it('keeps it for its exit animation, hidden from assistive tech, then removes it', () => {
    vi.useFakeTimers();
    render(<Probe />);
    fireEvent.click(screen.getByText('anchor'));
    fireEvent.click(screen.getByText('anchor'));
    expect(overlayEl()?.dataset.state).toBe('closed');
    expect(overlayEl()?.getAttribute('aria-hidden')).toBe('true');
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(overlayEl()).toBeNull();
  });

  it('does not bring a closed overlay back for an exit when closed again', () => {
    render(<Probe />);
    fireEvent.click(screen.getByText('close'));
    expect(overlayEl()).toBeNull();
  });

  it('names the anchor and places the overlay against it', () => {
    render(<Probe />);
    fireEvent.click(screen.getByText('anchor'));
    // jsdom drops the properties it doesn't know, so compare what is in the style attribute's source
    const anchor = screen.getByText('anchor');
    expect(anchor.getAttribute('style') ?? '').toMatch(/anchor-name:\s*--overlay-/);
    expect(overlayEl()?.getAttribute('style') ?? '').toMatch(/position-anchor:\s*--overlay-/);
  });

  it('closes on Escape anywhere only when asked to', () => {
    const { unmount } = render(<Probe />);
    fireEvent.click(screen.getByText('anchor'));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(overlayEl()?.dataset.state).toBe('open');
    unmount();

    render(<Probe isEscapeClosing />);
    fireEvent.click(screen.getByText('anchor'));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(overlayEl()?.dataset.state).toBe('closed');
  });

  it('closes only the overlay opened last on Escape', () => {
    render(
      <>
        <Probe isEscapeClosing />
        <Probe isEscapeClosing />
      </>,
    );
    const [first, second] = screen.getAllByText('anchor');
    fireEvent.click(first!);
    fireEvent.click(second!);
    const states = () => screen.getAllByTestId('overlay').map((el) => el.dataset.state);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(states()).toEqual(['open', 'closed']);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(states()).toEqual(['closed', 'closed']);
  });

  it('is a dialog, not a popover, when it is modal: no popover attribute, no anchor placement', () => {
    render(<Probe isModal />);
    fireEvent.click(screen.getByText('anchor'));
    expect(overlayEl()?.hasAttribute('popover')).toBe(false);
    expect(overlayEl()?.getAttribute('style') ?? '').not.toMatch(/position-anchor/);
  });

  describe('isOutsideClosing', () => {
    const renderOpen = (options: UseOverlayOptions = { isOutsideClosing: true }) => {
      render(
        <>
          <Probe {...options} />
          <p>elsewhere</p>
        </>,
      );
      fireEvent.click(screen.getByText('anchor'));
    };

    it('does nothing unless asked to', () => {
      renderOpen({});
      fireEvent.pointerDown(screen.getByText('elsewhere'));
      expect(overlayEl()?.dataset.state).toBe('open');
    });

    it('closes on a press outside', () => {
      renderOpen();
      fireEvent.pointerDown(screen.getByText('elsewhere'));
      expect(overlayEl()?.dataset.state).toBe('closed');
    });

    it('stays open for a press inside the overlay or on the anchor', () => {
      renderOpen();
      fireEvent.pointerDown(overlayEl() as HTMLElement);
      fireEvent.pointerDown(screen.getByText('anchor'));
      expect(overlayEl()?.dataset.state).toBe('open');
    });

    it('lets the anchor’s own press toggle it, not close it and reopen it', () => {
      renderOpen();
      fireEvent.pointerDown(screen.getByText('anchor'));
      fireEvent.click(screen.getByText('anchor'));
      expect(overlayEl()?.dataset.state).toBe('closed');
    });

    it('sees a press whose handler stops it', () => {
      render(
        <>
          <Probe isOutsideClosing />
          <p onPointerDown={(event) => event.stopPropagation()}>elsewhere</p>
        </>,
      );
      fireEvent.click(screen.getByText('anchor'));
      fireEvent.pointerDown(screen.getByText('elsewhere'));
      expect(overlayEl()?.dataset.state).toBe('closed');
    });

    it('closes when focus moves outside, and not when it moves inside', () => {
      render(
        <>
          <Probe isOutsideClosing />
          <button>elsewhere</button>
        </>,
      );
      fireEvent.click(screen.getByText('anchor'));
      act(() => screen.getByText('anchor').focus());
      expect(overlayEl()?.dataset.state).toBe('open');
      act(() => screen.getByText('elsewhere').focus());
      expect(overlayEl()?.dataset.state).toBe('closed');
    });

    it('stops listening once it is closed', () => {
      renderOpen();
      const remove = vi.spyOn(document, 'removeEventListener');
      fireEvent.click(screen.getByText('close'));
      expect(remove).toHaveBeenCalledWith('pointerdown', expect.anything(), true);
      expect(remove).toHaveBeenCalledWith('focusin', expect.anything());
      remove.mockRestore();
    });
  });

  describe('isFocusReturned', () => {
    function Focusable(options: UseOverlayOptions) {
      const overlay = useOverlay(options);
      return (
        <>
          <button ref={overlay.anchorRef} onClick={overlay.toggle}>
            anchor
          </button>
          <button>elsewhere</button>
          {overlay.isPresent && (
            <div {...overlay.overlayProps} data-testid="overlay">
              <button>inside</button>
            </div>
          )}
        </>
      );
    }

    it('puts focus back on the anchor when it closes with focus inside', () => {
      render(<Focusable isFocusReturned isEscapeClosing />);
      fireEvent.click(screen.getByText('anchor'));
      act(() => screen.getByText('inside').focus());
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(document.activeElement).toBe(screen.getByText('anchor'));
    });

    it('leaves focus alone when it was elsewhere', () => {
      render(<Focusable isFocusReturned isEscapeClosing />);
      fireEvent.click(screen.getByText('anchor'));
      act(() => screen.getByText('elsewhere').focus());
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(document.activeElement).toBe(screen.getByText('elsewhere'));
    });

    it('does not take focus back from a press outside', () => {
      render(<Focusable isFocusReturned isOutsideClosing />);
      fireEvent.click(screen.getByText('anchor'));
      act(() => screen.getByText('inside').focus());
      fireEvent.pointerDown(screen.getByText('elsewhere'));
      expect(document.activeElement).not.toBe(screen.getByText('anchor'));
    });

    it('does nothing unless asked to, and not when it never opened', () => {
      render(<Focusable isEscapeClosing />);
      fireEvent.click(screen.getByText('anchor'));
      act(() => screen.getByText('inside').focus());
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(document.activeElement).not.toBe(screen.getByText('anchor'));
      cleanup();

      render(<Focusable isFocusReturned />);
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('controlled', () => {
    it('follows isOpen and reports what open and close ask for, without changing it itself', () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<Probe isOpen={false} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByText('anchor'));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(overlayEl()).toBeNull();

      rerender(<Probe isOpen onOpenChange={onOpenChange} />);
      expect(overlayEl()?.dataset.state).toBe('open');
      fireEvent.click(screen.getByText('close'));
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(overlayEl()?.dataset.state).toBe('open');

      rerender(<Probe isOpen={false} onOpenChange={onOpenChange} />);
      expect(overlayEl()?.dataset.state).toBe('closed');
    });

    it('starts open with defaultIsOpen', () => {
      render(<Probe defaultIsOpen />);
      expect(overlayEl()?.dataset.state).toBe('open');
    });
  });
});
