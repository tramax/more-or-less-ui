import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { Indicator } from './Indicator';
import sizes from '../_shared/Size.module.css';
import styles from './Indicator.module.css';

const renderIndicator = (props: Partial<ComponentProps<typeof Indicator>> = {}) => {
  const { container } = render(
    <Indicator {...props}>
      <button type="button">Inbox</button>
    </Indicator>,
  );
  return container.firstElementChild as HTMLSpanElement;
};

const has = (el: Element | null, className: string | undefined) =>
  el?.classList.contains(className ?? '') ?? false;
const anchorOf = (root: HTMLElement) => root.querySelector<HTMLElement>(`.${styles.anchor}`);
const markOf = (root: HTMLElement) => root.querySelector<HTMLElement>(`.${styles.mark}`);

afterEach(cleanup);

describe('Indicator', () => {
  describe('element', () => {
    it('renders a span around its children', () => {
      const el = renderIndicator();
      expect(el.tagName).toBe('SPAN');
      expect(screen.getByRole('button', { name: 'Inbox' }).parentElement).toBe(el);
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLSpanElement>();
      render(
        <Indicator ref={ref}>
          <i />
        </Indicator>,
      );
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('passes DOM attributes through, and merges className and style', () => {
      const el = renderIndicator({ id: 'i', className: 'extra', style: { margin: '2px' } });
      expect(el.id).toBe('i');
      expect(has(el, 'extra')).toBe(true);
      expect(el.style.margin).toBe('2px');
    });

    it('does not leak its own props to the DOM', () => {
      const el = renderIndicator({
        count: 3,
        max: 9,
        isZeroShown: true,
        isHidden: false,
        placement: 'bottom-start',
        overlap: 'circle',
        size: 'more',
        label: '3 unread',
      });
      for (const attr of ['count', 'max', 'placement', 'overlap', 'size', 'label'])
        expect(el.hasAttribute(attr)).toBe(false);
    });
  });

  describe('dot and count', () => {
    it('is a dot without a count', () => {
      const el = renderIndicator();
      expect(has(markOf(el), styles.dot)).toBe(true);
      expect(markOf(el)?.textContent).toBe('');
    });

    it('shows the count', () => {
      const el = renderIndicator({ count: 3 });
      expect(has(markOf(el), styles.count)).toBe(true);
      expect(markOf(el)?.textContent).toBe('3');
    });

    it('shows nothing for 0, or a negative number, unless isZeroShown', () => {
      expect(markOf(renderIndicator({ count: 0 }))).toBeNull();
      cleanup();
      expect(markOf(renderIndicator({ count: -2 }))).toBeNull();
      cleanup();
      expect(markOf(renderIndicator({ count: 0, isZeroShown: true }))?.textContent).toBe('0');
    });

    it('updates the count in place, without leaving', () => {
      const { container, rerender } = render(
        <Indicator count={3}>
          <i />
        </Indicator>,
      );
      const mark = markOf(container.firstElementChild as HTMLElement);
      rerender(
        <Indicator count={5}>
          <i />
        </Indicator>,
      );
      expect(markOf(container.firstElementChild as HTMLElement)).toBe(mark);
      expect(mark?.textContent).toBe('5');
      expect(has(mark, styles.leaving)).toBe(false);
    });

    it('caps the count at max, 99 by default', () => {
      expect(markOf(renderIndicator({ count: 99 }))?.textContent).toBe('99');
      cleanup();
      expect(markOf(renderIndicator({ count: 100 }))?.textContent).toBe('99+');
      cleanup();
      expect(markOf(renderIndicator({ count: 10, max: 9 }))?.textContent).toBe('9+');
    });

    it('falls back to 99 for a max that is zero or negative', () => {
      expect(markOf(renderIndicator({ count: 500, max: 0 }))?.textContent).toBe('99+');
    });

    it('treats a count that is not finite as a dot', () => {
      const el = renderIndicator({ count: NaN });
      expect(has(markOf(el), styles.dot)).toBe(true);
    });

    it('is not drawn at all when it starts hidden, and the children are mounted', () => {
      const el = renderIndicator({ isHidden: true, count: 3 });
      expect(markOf(el)).toBeNull();
      expect(screen.getByRole('button', { name: 'Inbox' })).toBeTruthy();
    });
  });

  describe('leaving', () => {
    const withProps = (props: Partial<ComponentProps<typeof Indicator>>) => (
      <Indicator label="3 unread" count={3} {...props}>
        <button type="button">Inbox</button>
      </Indicator>
    );

    it('shrinks away when hidden, showing what it last showed, then unmounts', () => {
      const { container, rerender } = render(withProps({}));
      const root = container.firstElementChild as HTMLElement;
      rerender(withProps({ isHidden: true }));

      const mark = markOf(root);
      expect(has(mark, styles.leaving)).toBe(true);
      expect(mark?.textContent).toBe('3');
      expect(screen.getByRole('button', { name: 'Inbox' })).toBeTruthy();

      fireEvent.animationEnd(mark as HTMLElement);
      expect(markOf(root)).toBeNull();
    });

    it('keeps the old number while a count that fell to 0 leaves', () => {
      const { container, rerender } = render(withProps({}));
      rerender(withProps({ count: 0 }));
      expect(markOf(container.firstElementChild as HTMLElement)?.textContent).toBe('3');
    });

    it('is already hidden from assistive tech while it leaves', () => {
      const { rerender } = render(withProps({}));
      expect(screen.getByRole('img', { name: '3 unread' })).toBeTruthy();
      rerender(withProps({ isHidden: true }));
      expect(screen.queryByRole('img')).toBeNull();
    });

    it('stays when the pop-in animation ends', () => {
      const { container } = render(withProps({}));
      const root = container.firstElementChild as HTMLElement;
      fireEvent.animationEnd(markOf(root) as HTMLElement);
      expect(markOf(root)).not.toBeNull();
    });

    it('comes back, and stops leaving, when shown again before it has gone', () => {
      const { container, rerender } = render(withProps({}));
      const root = container.firstElementChild as HTMLElement;
      rerender(withProps({ isHidden: true }));
      rerender(withProps({ isHidden: false }));
      expect(has(markOf(root), styles.leaving)).toBe(false);
      fireEvent.animationEnd(markOf(root) as HTMLElement);
      expect(markOf(root)).not.toBeNull();
    });
  });

  describe('accessible name', () => {
    it('is hidden from assistive tech until named', () => {
      const anchor = anchorOf(renderIndicator({ count: 3 }));
      expect(anchor?.getAttribute('aria-hidden')).toBe('true');
      expect(anchor?.hasAttribute('role')).toBe(false);
    });

    it('is an image with the label as its name', () => {
      renderIndicator({ count: 3, label: '3 unread messages' });
      expect(screen.getByRole('img', { name: '3 unread messages' })).toBeTruthy();
    });
  });

  describe('placement and overlap', () => {
    it('defaults to the top end of a rectangle', () => {
      const el = renderIndicator();
      expect(has(anchorOf(el), styles.topEnd)).toBe(true);
      expect(has(el, styles.circle)).toBe(false);
    });

    it.each([
      ['top-end', 'topEnd'],
      ['top-start', 'topStart'],
      ['bottom-end', 'bottomEnd'],
      ['bottom-start', 'bottomStart'],
    ] as const)('puts %s on the %s class', (placement, className) => {
      const el = renderIndicator({ placement });
      expect(has(anchorOf(el), styles[className])).toBe(true);
    });

    it('sits on the rim of a circle', () => {
      expect(has(renderIndicator({ overlap: 'circle' }), styles.circle)).toBe(true);
    });
  });

  describe('size', () => {
    it('defaults to normal, on the mark and not on the wrapper', () => {
      const el = renderIndicator();
      expect(has(markOf(el), sizes.sizeNormal)).toBe(true);
      expect(has(el, sizes.sizeNormal)).toBe(false);
    });

    it.each(['less', 'more'] as const)('maps size="%s" to its class', (size) => {
      const mark = markOf(renderIndicator({ size }));
      expect(has(mark, sizes[`size${size === 'less' ? 'Less' : 'More'}`])).toBe(true);
    });

    it('takes an escape-hatch size as font-size', () => {
      expect(markOf(renderIndicator({ size: '2rem' }))?.style.fontSize).toBe('2rem');
    });
  });
});
