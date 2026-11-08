import { useRef } from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { REFLOW_MS, useReflow } from './useReflow';

function Column({ ids, isHidden = false }: { ids: string[]; isHidden?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useReflow(ref);
  return (
    <div ref={ref} style={{ display: isHidden ? 'none' : undefined }}>
      {ids.map((id) => (
        <p key={id} data-id={id}>
          {id}
        </p>
      ))}
    </div>
  );
}

const animate = vi.fn();
const cancel = vi.fn();

beforeEach(() => {
  animate.mockReset();
  animate.mockReturnValue({ cancel });
  cancel.mockReset();
  // jsdom lays nothing out and has no Web Animations. A column anchored to the bottom of room for three
  // 50px toasts: a child's place is its index counted from the bottom, so adding one moves the others up.
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      // A browser reports 0 for everything in a `display: none` element
      if (this.parentElement?.style.display === 'none') return 0;
      const siblings = [...(this.parentElement?.children ?? [])];
      return (3 - siblings.length + siblings.indexOf(this)) * 50;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (HTMLElement.prototype as { offsetTop?: number }).offsetTop;
  delete (HTMLElement.prototype as { animate?: unknown }).animate;
});

const animatedIds = () =>
  animate.mock.instances.map((el: unknown) => (el as HTMLElement).dataset.id);

describe('useReflow', () => {
  it('animates nothing for children it sees for the first time', () => {
    render(<Column ids={['a', 'b']} />);
    expect(animate).not.toHaveBeenCalled();
  });

  it('does not measure a column that is not shown yet, so the first toast does not fly in from the top', () => {
    // The viewport is `display: none` until it has shown itself; then the next render sees the real place
    const { rerender } = render(<Column ids={['a']} isHidden />);
    rerender(<Column ids={['a']} />);
    expect(animate).not.toHaveBeenCalled();
    // And it is measured from then on
    rerender(<Column ids={['a', 'b']} />);
    expect(animatedIds()).toEqual(['a']);
  });

  it('glides the children that moved when one is added, and not the new one', () => {
    const { rerender } = render(<Column ids={['a']} />);
    rerender(<Column ids={['a', 'b']} />);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animatedIds()).toEqual(['a']);
    // It was 50px lower, and is animated from there to where it is now
    expect(animate).toHaveBeenCalledWith([{ translate: '0 50px' }, { translate: '0 0' }], {
      duration: REFLOW_MS,
      easing: 'ease',
    });
  });

  it('glides the other way when one is removed from the edge', () => {
    const { rerender } = render(<Column ids={['a', 'b', 'c']} />);
    rerender(<Column ids={['a', 'b']} />);
    expect(animatedIds()).toEqual(['a', 'b']);
    expect(animate.mock.calls[0]?.[0]).toEqual([{ translate: '0 -50px' }, { translate: '0 0' }]);
  });

  it('animates nothing when the one removed is the one furthest from the edge', () => {
    const { rerender } = render(<Column ids={['a', 'b', 'c']} />);
    // The others stay where they are: the column is anchored at the other end
    rerender(<Column ids={['b', 'c']} />);
    expect(animate).not.toHaveBeenCalled();
  });

  it('stops the glide in progress before it starts the next', () => {
    const { rerender } = render(<Column ids={['a']} />);
    rerender(<Column ids={['a', 'b']} />);
    rerender(<Column ids={['a', 'b', 'c']} />);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('does not glide under prefers-reduced-motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    const { rerender } = render(<Column ids={['a']} />);
    rerender(<Column ids={['a', 'b']} />);
    expect(animate).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('does nothing where there is no Web Animations API', () => {
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
    const { rerender } = render(<Column ids={['a']} />);
    expect(() => rerender(<Column ids={['a', 'b']} />)).not.toThrow();
  });
});
