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
  'minWidth',
  'minHeight',
  'borderRadius',
  'boxShadow',
  'background',
] as const;
const VARIANTS = ['less', 'normal', 'more'] as const;
const DEFAULT_CLASSES = [styles.paddingNormal, styles.borderRadiusNormal, styles.backgroundNormal];
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

    it('adds only the default classes and no styles when no scale props are set', () => {
      const el = renderBox();
      expect([...el.classList]).toEqual(DEFAULT_CLASSES);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('does not leak scale props to the DOM', () => {
      const el = renderBox({ padding: 'more', minWidth: 100 });
      expect(el.hasAttribute('padding')).toBe(false);
      expect(el.hasAttribute('minWidth')).toBe(false);
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

    it('combines several props', () => {
      const el = renderBox({ padding: 'more', margin: 'less', borderRadius: 'normal' });
      expect([...el.classList]).toEqual([
        styles.paddingMore,
        styles.marginLess,
        styles.borderRadiusNormal,
        styles.backgroundNormal,
      ]);
    });
  });

  describe('defaults', () => {
    it.each(['padding', 'borderRadius', 'background'] as const)('%s defaults to normal', (prop) => {
      expect(renderBox().classList.contains(styles[`${prop}Normal`] as string)).toBe(true);
    });

    it.each(['margin', 'boxShadow', 'minWidth', 'minHeight'] as const)('%s is opt-in', (prop) => {
      const el = renderBox();
      for (const variant of VARIANTS) {
        expect(el.classList.contains(styles[`${prop}${cap(variant)}`] as string)).toBe(false);
      }
    });

    it('replaces the default when a variant is given', () => {
      const el = renderBox({ padding: 'more' });
      expect(el.classList.contains(styles.paddingMore as string)).toBe(true);
      expect(el.classList.contains(styles.paddingNormal as string)).toBe(false);
    });

    it('is replaced by an escape-hatch value, including 0', () => {
      const el = renderBox({ padding: 0, background: 'red' });
      expect(el.style.padding).toBe('0px');
      expect(el.style.background).toBe('red');
      expect(el.classList.contains(styles.paddingNormal as string)).toBe(false);
      expect(el.classList.contains(styles.backgroundNormal as string)).toBe(false);
    });

    it('lets a per-side prop override the default shorthand', () => {
      const el = renderBox({ paddingLeft: 'less' });
      expect(el.classList.contains(styles.paddingNormal as string)).toBe(true);
      expect(el.classList.contains(styles.paddingLeftLess as string)).toBe(true);
    });

    it('turns the background off with "less" (transparent)', () => {
      const el = renderBox({ background: 'less' });
      expect(el.classList.contains(styles.backgroundLess as string)).toBe(true);
    });
  });

  describe('escape hatch', () => {
    it('writes strings to the matching CSS property', () => {
      const el = renderBox({ padding: '12px 24px', borderRadius: '50%', margin: '1.5rem' });
      expect(el.style.padding).toBe('12px 24px');
      expect(el.style.borderRadius).toBe('50%');
      expect(el.style.margin).toBe('1.5rem');
      expect([...el.classList]).toEqual([styles.backgroundNormal]);
    });

    it('treats numbers as pixels', () => {
      const el = renderBox({ minWidth: 300, minHeight: 20, marginLeft: 8 });
      expect(el.style.minWidth).toBe('300px');
      expect(el.style.minHeight).toBe('20px');
      expect(el.style.marginLeft).toBe('8px');
    });

    it('mixes a variant on one prop with an escape hatch on another', () => {
      const el = renderBox({ padding: 'more', minWidth: '50%' });
      expect(el.classList.contains(styles.paddingMore as string)).toBe(true);
      expect(el.style.minWidth).toBe('50%');
    });
  });

  describe('className and style', () => {
    it('merges className with variant classes', () => {
      const el = renderBox({ className: 'mine', padding: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.paddingMore as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderBox({ minWidth: 100, style: { minWidth: 200, color: 'red' } });
      expect(el.style.minWidth).toBe('200px');
      expect(el.style.color).toBe('red');
    });
  });
});
