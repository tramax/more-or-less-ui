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
      expect(svg?.querySelector(`.${styles.ring}`)).not.toBeNull();
      expect(svg?.querySelector(`.${styles.arc}`)?.getAttribute('pathLength')).toBe('100');
    });

    it('uses Spinner for an indeterminate circle, and leaves the semantics to the root', () => {
      const el = renderProgress({ shape: 'circle' });
      const ring = el.querySelector(`.${spinnerStyles.spinner}`);
      expect(ring).not.toBeNull();
      expect(ring?.getAttribute('aria-hidden')).toBe('true');
      expect(ring?.hasAttribute('role')).toBe(false);
      expect(el.querySelector('svg')).toBeNull();
    });

    it('has no spinner in a determinate circle or in a bar', () => {
      expect(
        renderProgress({ shape: 'circle', value: 1 }).querySelector(`.${spinnerStyles.spinner}`),
      ).toBeNull();
      cleanup();
      expect(renderProgress().querySelector(`.${spinnerStyles.spinner}`)).toBeNull();
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
