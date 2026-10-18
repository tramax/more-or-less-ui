import { createRef, type ComponentProps } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Box } from './Box';
import styles from './Box.module.css';

const renderBox = (props: ComponentProps<typeof Box> = {}) => {
  const { container } = render(<Box {...props} />);
  return container.firstElementChild as HTMLDivElement;
};

const SCALE_PROPS = [
  'size',
  'padding',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'margin',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'gap',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'borderRadius',
  'boxShadow',
  'background',
] as const;
const VARIANTS = ['less', 'normal', 'more'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

describe('Box', () => {
  describe('element', () => {
    it('renders a div with children', () => {
      const el = renderBox({ children: 'hi' });
      expect(el.tagName).toBe('DIV');
      expect(el.textContent).toBe('hi');
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Box ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderBox({ id: 'a', 'aria-label': 'b' });
      expect(el.id).toBe('a');
      expect(el.getAttribute('aria-label')).toBe('b');
    });

    it('adds no classes or styles when no scale props are set', () => {
      const el = renderBox();
      expect(el.getAttribute('class')).toBeFalsy();
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('does not leak scale props to the DOM', () => {
      const el = renderBox({ padding: 'more', width: 100, size: 'less' });
      expect(el.hasAttribute('padding')).toBe(false);
      expect(el.hasAttribute('width')).toBe(false);
      expect(el.hasAttribute('size')).toBe(false);
    });
  });

  describe('variants', () => {
    // Guards against the prop list and Box.module.css drifting apart
    it.each(SCALE_PROPS.flatMap((p) => VARIANTS.map((v) => [p, v] as const)))(
      '%s="%s" applies its class and no inline style',
      (prop, variant) => {
        const className = styles[`${prop}${cap(variant)}`];
        expect(className).toBeTruthy();

        const el = renderBox({ [prop]: variant });
        expect(el.classList.contains(className as string)).toBe(true);
        expect(el.getAttribute('style')).toBeFalsy();
      },
    );

    it('applies "normal" explicitly (Box has no base values)', () => {
      const el = renderBox({ padding: 'normal' });
      expect(el.classList.contains(styles.paddingNormal as string)).toBe(true);
    });

    it('combines several props', () => {
      const el = renderBox({ padding: 'more', margin: 'less', borderRadius: 'normal' });
      expect([...el.classList]).toEqual([
        styles.paddingMore,
        styles.marginLess,
        styles.borderRadiusNormal,
      ]);
    });
  });

  describe('escape hatch', () => {
    it('writes strings to the matching CSS property', () => {
      const el = renderBox({ padding: '12px 24px', borderRadius: '50%', gap: '1.5rem' });
      expect(el.style.padding).toBe('12px 24px');
      expect(el.style.borderRadius).toBe('50%');
      expect(el.style.gap).toBe('1.5rem');
      expect(el.getAttribute('class')).toBeFalsy();
    });

    it('treats numbers as pixels', () => {
      const el = renderBox({ width: 300, minHeight: 20, marginLeft: 8 });
      expect(el.style.width).toBe('300px');
      expect(el.style.minHeight).toBe('20px');
      expect(el.style.marginLeft).toBe('8px');
    });

    it('drives width and height from size', () => {
      const el = renderBox({ size: 40 });
      expect(el.style.width).toBe('40px');
      expect(el.style.height).toBe('40px');
    });

    it('mixes a variant on one prop with an escape hatch on another', () => {
      const el = renderBox({ padding: 'more', width: '50%' });
      expect(el.classList.contains(styles.paddingMore as string)).toBe(true);
      expect(el.style.width).toBe('50%');
    });
  });

  describe('layout props', () => {
    it('passes them through as inline styles', () => {
      const el = renderBox({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      });
      expect(el.style.display).toBe('flex');
      expect(el.style.flexDirection).toBe('column');
      expect(el.style.alignItems).toBe('center');
      expect(el.style.justifyContent).toBe('space-between');
    });
  });

  describe('className and style', () => {
    it('merges className with variant classes', () => {
      const el = renderBox({ className: 'mine', padding: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.paddingMore as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderBox({ width: 100, style: { width: 200, color: 'red' } });
      expect(el.style.width).toBe('200px');
      expect(el.style.color).toBe('red');
    });
  });
});
