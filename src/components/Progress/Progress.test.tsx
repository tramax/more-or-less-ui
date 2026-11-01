import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Progress } from './Progress';
import sizes from '../_shared/Size.module.css';
import styles from './Progress.module.css';
import spinnerStyles from '../Spinner/Spinner.module.css';

const renderProgress = (props: Partial<ComponentProps<typeof Progress>> = {}) => {
  const { container } = render(<Progress aria-label="Upload" {...props} />);
  return container.firstElementChild as HTMLDivElement;
};

const VARIANTS = ['less', 'normal', 'more'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const has = (el: Element, className: string | undefined) => el.classList.contains(className ?? '');
const percentOf = (el: HTMLElement) => el.style.getPropertyValue('--progress-value');

afterEach(cleanup);

describe('Progress', () => {
  describe('element', () => {
    it('renders a div that is a progressbar', () => {
      const el = renderProgress({ value: 40 });
      expect(el.tagName).toBe('DIV');
      expect(el.getAttribute('role')).toBe('progressbar');
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Progress ref={ref} aria-label="Upload" value={1} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('passes DOM attributes through, and merges className and style', () => {
      const el = renderProgress({ id: 'p', className: 'extra', style: { width: '10rem' } });
      expect(el.id).toBe('p');
      expect(has(el, 'extra')).toBe(true);
      expect(el.style.width).toBe('10rem');
    });

    it('does not leak its own props to the DOM', () => {
      const el = renderProgress({ shape: 'circle', size: 'more', value: 1, max: 2 });
      for (const attr of ['shape', 'size', 'value', 'max'])
        expect(el.hasAttribute(attr)).toBe(false);
    });
  });

  describe('value', () => {
    it('reports value, min and max to assistive tech', () => {
      const el = renderProgress({ value: 30 });
      expect(el.getAttribute('aria-valuenow')).toBe('30');
      expect(el.getAttribute('aria-valuemin')).toBe('0');
      expect(el.getAttribute('aria-valuemax')).toBe('100');
    });

    it('draws a share of `max`, as a number from 0 to 100', () => {
      const el = renderProgress({ value: 3, max: 12 });
      expect(el.getAttribute('aria-valuenow')).toBe('3');
      expect(el.getAttribute('aria-valuemax')).toBe('12');
      expect(percentOf(el)).toBe('25');
    });

    it.each([
      [-5, '0'],
      [0, '0'],
      [100, '100'],
      [250, '100'],
    ])('holds %j to the range: aria-valuenow and fill %s', (value, expected) => {
      const el = renderProgress({ value });
      expect(el.getAttribute('aria-valuenow')).toBe(expected);
      expect(percentOf(el)).toBe(expected);
    });

    it('falls back to 100 for a max that is zero or negative', () => {
      expect(renderProgress({ value: 50, max: 0 }).getAttribute('aria-valuemax')).toBe('100');
      cleanup();
      expect(renderProgress({ value: 50, max: -3 }).getAttribute('aria-valuemax')).toBe('100');
    });

    it('lets the caller override the custom property through style', () => {
      const el = renderProgress({ value: 10, style: { '--progress-value': 90 } as never });
      expect(percentOf(el)).toBe('90');
    });
  });

  describe('indeterminate', () => {
    it.each([[undefined], [NaN], [Infinity]])('value=%j has no valuenow and moves', (value) => {
      const el = renderProgress({ value });
      expect(el.hasAttribute('aria-valuenow')).toBe(false);
      expect(has(el, styles.indeterminate)).toBe(true);
      expect(percentOf(el)).toBe('');
    });

    it('is not marked indeterminate once it has a value', () => {
      expect(has(renderProgress({ value: 0 }), styles.indeterminate)).toBe(false);
    });

    it('still reports its range', () => {
      const el = renderProgress({ max: 8 });
      expect(el.getAttribute('aria-valuemin')).toBe('0');
      expect(el.getAttribute('aria-valuemax')).toBe('8');
    });
  });

  describe('shape', () => {
    it('is a bar by default, with a fill and no svg', () => {
      const el = renderProgress({ value: 40 });
      expect(has(el, styles.bar)).toBe(true);
      expect(el.querySelector(`.${styles.fill}`)).not.toBeNull();
      expect(el.querySelector('svg')).toBeNull();
    });

    it('draws a circle as a track and an arc, hidden from assistive tech', () => {
      const el = renderProgress({ shape: 'circle', value: 40 });
      expect(has(el, styles.circle)).toBe(true);
      expect(has(el, styles.bar)).toBe(false);
      const svg = el.querySelector('svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.querySelector(`.${styles.track}`)).not.toBeNull();
      expect(svg?.querySelector(`.${styles.arc}`)?.getAttribute('pathLength')).toBe('100');
    });

    it('uses Spinner for an indeterminate circle, and leaves the semantics to the root', () => {
      const el = renderProgress({ shape: 'circle' });
      const ring = el.querySelector(`.${spinnerStyles.spinner}`);
      expect(ring).not.toBeNull();
      expect(ring?.getAttribute('aria-hidden')).toBe('true');
      expect(ring?.hasAttribute('role')).toBe(false);
      // Spinner draws its own svg; Progress's track and arc are not there
      expect(el.querySelector(`.${styles.track}`)).toBeNull();
    });

    it('has no spinner in a determinate circle or in a bar', () => {
      expect(
        renderProgress({ shape: 'circle', value: 1 }).querySelector(`.${spinnerStyles.spinner}`),
      ).toBeNull();
      cleanup();
      expect(renderProgress().querySelector(`.${spinnerStyles.spinner}`)).toBeNull();
    });
  });

  describe('indeterminate bar', () => {
    it('has a lead segment and a fainter one that follows', () => {
      const el = renderProgress();
      const fills = el.querySelectorAll(`.${styles.fill}`);
      expect(fills).toHaveLength(2);
      expect(has(fills[0] as Element, styles.trail)).toBe(false);
      expect(has(fills[1] as Element, styles.trail)).toBe(true);
    });

    it('has a single fill once it has a value', () => {
      const el = renderProgress({ value: 20 });
      expect(el.querySelectorAll(`.${styles.fill}`)).toHaveLength(1);
      expect(el.querySelector(`.${styles.trail}`)).toBeNull();
    });
  });

  describe('motion', () => {
    const durationOf = (el: HTMLElement) => el.style.getPropertyValue('--progress-duration');
    const ms = (el: HTMLElement) => Number.parseInt(durationOf(el), 10);

    it('takes longer to cover a longer distance', () => {
      const { container, rerender } = render(<Progress aria-label="Upload" value={10} />);
      const el = container.firstElementChild as HTMLElement;
      rerender(<Progress aria-label="Upload" value={12} />);
      const nudge = ms(el);
      rerender(<Progress aria-label="Upload" value={90} />);
      const jump = ms(el);
      expect(nudge).toBeLessThan(jump);
      expect(nudge).toBeGreaterThanOrEqual(180);
      expect(jump).toBeLessThanOrEqual(780);
    });

    it('counts the distance in percent of max, whichever max', () => {
      const { container, rerender } = render(<Progress aria-label="Upload" value={0} max={10} />);
      const el = container.firstElementChild as HTMLElement;
      rerender(<Progress aria-label="Upload" value={5} max={10} />);
      const half = ms(el);
      rerender(<Progress aria-label="Upload" value={50} max={100} />);
      // 50% to 50%: no move, so the duration stays what the last move set
      expect(ms(el)).toBe(half);
    });

    it('has a duration only while it has a value', () => {
      expect(durationOf(renderProgress())).toBe('');
      cleanup();
      expect(durationOf(renderProgress({ value: 5 }))).not.toBe('');
    });

    it('uses the default for a change from or to indeterminate', () => {
      const { container, rerender } = render(<Progress aria-label="Upload" />);
      rerender(<Progress aria-label="Upload" value={80} />);
      expect(ms(container.firstElementChild as HTMLElement)).toBe(300);
    });

    it('lets the caller override the duration through style', () => {
      const el = renderProgress({ value: 5, style: { '--progress-duration': '1s' } as never });
      expect(durationOf(el)).toBe('1s');
    });
  });

  describe('finishing', () => {
    it('marks the arrival at the end from below', () => {
      const { container, rerender } = render(<Progress aria-label="Upload" value={60} />);
      const el = container.firstElementChild as HTMLElement;
      expect(has(el, styles.finished)).toBe(false);
      rerender(<Progress aria-label="Upload" value={100} />);
      expect(has(el, styles.finished)).toBe(true);
    });

    it('does not mark a progress that is full when it first appears', () => {
      expect(has(renderProgress({ value: 100 }), styles.finished)).toBe(false);
    });

    it('does not mark a value above max, held to the end, as a second arrival', () => {
      const { container, rerender } = render(<Progress aria-label="Upload" value={100} />);
      const el = container.firstElementChild as HTMLElement;
      rerender(<Progress aria-label="Upload" value={140} />);
      expect(has(el, styles.finished)).toBe(false);
    });

    it('clears the mark when the value leaves the end, and sets it again on the next arrival', () => {
      const { container, rerender } = render(<Progress aria-label="Upload" value={50} />);
      const el = container.firstElementChild as HTMLElement;
      rerender(<Progress aria-label="Upload" value={100} />);
      rerender(<Progress aria-label="Upload" value={40} />);
      expect(has(el, styles.finished)).toBe(false);
      rerender(<Progress aria-label="Upload" value={100} />);
      expect(has(el, styles.finished)).toBe(true);
    });

    it('does not mark an indeterminate progress', () => {
      const { container, rerender } = render(<Progress aria-label="Upload" value={50} />);
      rerender(<Progress aria-label="Upload" />);
      expect(has(container.firstElementChild as Element, styles.finished)).toBe(false);
    });

    it('marks a circle too', () => {
      const { container, rerender } = render(
        <Progress aria-label="Upload" shape="circle" value={20} />,
      );
      rerender(<Progress aria-label="Upload" shape="circle" value={100} />);
      expect(has(container.firstElementChild as Element, styles.finished)).toBe(true);
    });
  });

  describe('size', () => {
    it('defaults to normal', () => {
      expect(has(renderProgress(), sizes.sizeNormal)).toBe(true);
    });

    it.each(VARIANTS)('size="%s" adds the class for it', (v) => {
      const el = renderProgress({ size: v });
      expect(has(el, sizes[`size${cap(v)}`])).toBe(true);
      expect(has(el, sizes.sizeNormal)).toBe(v === 'normal');
    });

    it('sets font-size inline for an escape-hatch value', () => {
      const el = renderProgress({ size: '1.5rem' });
      expect(el.style.fontSize).toBe('1.5rem');
      expect(has(el, sizes.sizeNormal)).toBe(false);
    });
  });

  describe('name', () => {
    it('is named by aria-label or aria-labelledby, passed through', () => {
      expect(renderProgress({ value: 1 }).getAttribute('aria-label')).toBe('Upload');
      cleanup();
      const { container } = render(<Progress aria-labelledby="h" value={1} />);
      expect(container.firstElementChild?.getAttribute('aria-labelledby')).toBe('h');
    });

    it('passes aria-valuetext through', () => {
      expect(
        renderProgress({ value: 3, 'aria-valuetext': '3 of 12 files' }).getAttribute(
          'aria-valuetext',
        ),
      ).toBe('3 of 12 files');
    });
  });
});
