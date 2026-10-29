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

    it('is a plain div with no classes and no styles when no props are set', () => {
      const el = renderBox();
      expect(el.classList.length).toBe(0);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('does not leak scale props to the DOM', () => {
      const el = renderBox({ padding: 'more', margin: 'less' });
      expect(el.hasAttribute('padding')).toBe(false);
      expect(el.hasAttribute('margin')).toBe(false);
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
        expect([...el.classList]).toEqual([className]);
        expect(el.getAttribute('style')).toBeFalsy();
      },
    );

    it('combines several props, shorthands before per-side props', () => {
      const el = renderBox({ paddingLeft: 'less', padding: 'more', margin: 'less' });
      expect([...el.classList]).toEqual([
        styles.paddingMore,
        styles.paddingLeftLess,
        styles.marginLess,
      ]);
    });
  });

  describe('escape hatch', () => {
    it('writes strings to the matching CSS property', () => {
      const el = renderBox({ padding: '12px 24px', margin: '1.5rem' });
      expect(el.style.padding).toBe('12px 24px');
      expect(el.style.margin).toBe('1.5rem');
      expect(el.classList.length).toBe(0);
    });

    it('treats numbers as pixels, including 0', () => {
      const el = renderBox({ marginTop: 300, marginBottom: 20, marginLeft: 8, padding: 0 });
      expect(el.style.marginTop).toBe('300px');
      expect(el.style.marginBottom).toBe('20px');
      expect(el.style.marginLeft).toBe('8px');
      expect(el.style.padding).toBe('0px');
    });

    it('supports auto margins to push a box to the end', () => {
      expect(renderBox({ marginLeft: 'auto' }).style.marginLeft).toBe('auto');
    });

    it('mixes a variant on one prop with an escape hatch on another', () => {
      const el = renderBox({ padding: 'more', margin: '50%' });
      expect(el.classList.contains(styles.paddingMore as string)).toBe(true);
      expect(el.style.margin).toBe('50%');
    });
  });

  describe('className and style', () => {
    it('merges className with variant classes', () => {
      const el = renderBox({ className: 'mine', padding: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.paddingMore as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderBox({ margin: 100, style: { margin: 200, color: 'red' } });
      expect(el.style.margin).toBe('200px');
      expect(el.style.color).toBe('red');
    });
  });
});
