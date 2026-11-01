import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Spinner } from './Spinner';
import sizes from '../_shared/Size.module.css';
import styles from './Spinner.module.css';

const renderSpinner = (props: ComponentProps<typeof Spinner> = {}) => {
  const { container } = render(<Spinner {...props} />);
  return container.firstElementChild as HTMLSpanElement;
};

const VARIANTS = ['less', 'normal', 'more'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

afterEach(cleanup);

describe('Spinner', () => {
  describe('element', () => {
    it('renders a span with the ring class', () => {
      const el = renderSpinner();
      expect(el.tagName).toBe('SPAN');
      expect(el.classList.contains(styles.spinner as string)).toBe(true);
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLSpanElement>();
      render(<Spinner ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('passes DOM attributes through, and merges className and style', () => {
      const el = renderSpinner({ id: 's', className: 'extra', style: { color: 'red' } });
      expect(el.id).toBe('s');
      expect(el.classList.contains('extra')).toBe(true);
      expect(el.classList.contains(styles.spinner as string)).toBe(true);
      expect(el.style.color).toBe('red');
    });
  });

  describe('drawing', () => {
    it('is an arc on a hidden svg, so only the span is named or hidden', () => {
      const svg = renderSpinner().querySelector('svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.querySelectorAll('circle')).toHaveLength(1);
      expect(svg?.querySelector('circle')?.getAttribute('pathLength')).toBe('100');
    });
  });

  describe('size', () => {
    it('has no size class by default: it follows the surrounding text', () => {
      const el = renderSpinner();
      for (const v of VARIANTS) {
        expect(el.classList.contains(sizes[`size${cap(v)}`] as string)).toBe(false);
      }
      expect(el.style.fontSize).toBe('');
    });

    it.each(VARIANTS)('size="%s" adds the class for it', (v) => {
      const el = renderSpinner({ size: v });
      expect(el.classList.contains(sizes[`size${cap(v)}`] as string)).toBe(true);
      expect(el.hasAttribute('size')).toBe(false);
    });

    it('sets font-size inline for an escape-hatch value, a number as pixels', () => {
      expect(renderSpinner({ size: '2rem' }).style.fontSize).toBe('2rem');
      cleanup();
      expect(renderSpinner({ size: 24 }).style.fontSize).toBe('24px');
    });
  });

  describe('accessibility', () => {
    it('is hidden from assistive tech without a name', () => {
      const el = renderSpinner();
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.hasAttribute('role')).toBe(false);
    });

    it.each([
      ['aria-label', 'Loading'],
      ['aria-labelledby', 'heading'],
    ])('is a progressbar with no value once named by %s', (attr, value) => {
      const el = renderSpinner({ [attr]: value });
      expect(el.getAttribute('role')).toBe('progressbar');
      expect(el.hasAttribute('aria-hidden')).toBe(false);
      expect(el.getAttribute(attr)).toBe(value);
      // No aria-valuenow is what makes it indeterminate
      expect(el.hasAttribute('aria-valuenow')).toBe(false);
    });

    it('stays hidden with an empty aria-label', () => {
      const el = renderSpinner({ 'aria-label': '' });
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.hasAttribute('role')).toBe(false);
    });
  });
});
