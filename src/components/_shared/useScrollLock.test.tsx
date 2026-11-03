import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useScrollLock } from './useScrollLock';

function Lock({ isLocked }: { isLocked: boolean }) {
  useScrollLock(isLocked);
  return null;
}

const html = document.documentElement;

// jsdom has no layout: say the page has a 15px scrollbar
const setScrollbar = (width: number) => {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1000);
  vi.spyOn(html, 'clientWidth', 'get').mockReturnValue(1000 - width);
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  html.removeAttribute('style');
});

describe('useScrollLock', () => {
  it('stops the page scrolling, and gives the scrollbar’s width back as padding', () => {
    setScrollbar(15);
    render(<Lock isLocked />);
    expect(html.style.overflow).toBe('hidden');
    expect(html.style.paddingRight).toContain('15px');
  });

  it('adds no padding when the scrollbar has no width', () => {
    setScrollbar(0);
    render(<Lock isLocked />);
    expect(html.style.overflow).toBe('hidden');
    expect(html.style.paddingRight).toBe('');
  });

  it('puts back what was there, and does nothing until it is locked', () => {
    setScrollbar(15);
    html.style.overflow = 'scroll';
    const { rerender } = render(<Lock isLocked={false} />);
    expect(html.style.overflow).toBe('scroll');
    rerender(<Lock isLocked />);
    expect(html.style.overflow).toBe('hidden');
    rerender(<Lock isLocked={false} />);
    expect(html.style.overflow).toBe('scroll');
    expect(html.style.paddingRight).toBe('');
  });

  it('stays locked until the last of several is gone', () => {
    setScrollbar(15);
    const first = render(<Lock isLocked />);
    const second = render(<Lock isLocked />);
    first.unmount();
    expect(html.style.overflow).toBe('hidden');
    second.unmount();
    expect(html.style.overflow).toBe('');
  });
});
