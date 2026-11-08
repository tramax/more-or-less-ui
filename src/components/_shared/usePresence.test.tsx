import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { EXIT_MS, usePresence } from './usePresence';

function Probe({ isOpen }: { isOpen: boolean }) {
  return <p>{usePresence(isOpen) ? 'present' : 'gone'}</p>;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('usePresence', () => {
  it('is present while open, and gone when it starts closed', () => {
    const { rerender } = render(<Probe isOpen />);
    expect(screen.getByText('present')).toBeTruthy();
    rerender(<Probe isOpen />);
    expect(screen.getByText('present')).toBeTruthy();
    cleanup();
    render(<Probe isOpen={false} />);
    expect(screen.getByText('gone')).toBeTruthy();
  });

  it('stays present for the exit animation after it closes, in the same render', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Probe isOpen />);
    rerender(<Probe isOpen={false} />);
    expect(screen.getByText('present')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(EXIT_MS - 1);
    });
    expect(screen.getByText('present')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('gone')).toBeTruthy();
  });

  it('stays for as long as the caller says its exit takes', () => {
    vi.useFakeTimers();
    function Slow({ isOpen }: { isOpen: boolean }) {
      return <p>{usePresence(isOpen, 500) ? 'present' : 'gone'}</p>;
    }
    const { rerender } = render(<Slow isOpen />);
    rerender(<Slow isOpen={false} />);
    act(() => {
      vi.advanceTimersByTime(EXIT_MS + 100);
    });
    expect(screen.getByText('present')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText('gone')).toBeTruthy();
  });

  it('stays present when it opens again while leaving', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Probe isOpen />);
    rerender(<Probe isOpen={false} />);
    rerender(<Probe isOpen />);
    act(() => {
      vi.advanceTimersByTime(EXIT_MS * 2);
    });
    expect(screen.getByText('present')).toBeTruthy();
  });
});
