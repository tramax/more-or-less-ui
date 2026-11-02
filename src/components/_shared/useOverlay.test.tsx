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
});
