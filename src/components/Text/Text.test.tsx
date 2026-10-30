import { createRef, type ComponentProps } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Text, type TextElement } from './Text';
import styles from './Text.module.css';

const renderText = (props: ComponentProps<typeof Text> = {}) => {
  const { container } = render(<Text {...props} />);
  return container.firstElementChild as HTMLElement;
};

const SCALE_PROPS = ['size', 'fontWeight', 'color'] as const;
const VARIANTS = ['less', 'normal', 'more'] as const;
const ELEMENTS: TextElement[] = [
  'span',
  'p',
  'div',
  'strong',
  'em',
  'small',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

describe('Text', () => {
  describe('element', () => {
    it('renders a span with children', () => {
      const el = renderText({ children: 'hi' });
      expect(el.tagName).toBe('SPAN');
      expect(el.textContent).toBe('hi');
    });

    it.each(ELEMENTS)('as="%s" renders that element', (as) => {
      expect(renderText({ as }).tagName).toBe(as.toUpperCase());
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLElement>();
      render(<Text ref={ref} as="p" />);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderText({ id: 'a', 'aria-label': 'b' });
      expect(el.id).toBe('a');
      expect(el.getAttribute('aria-label')).toBe('b');
    });

    it('does not leak its props to the DOM', () => {
      const el = renderText({ as: 'p', size: 'more', fontWeight: 'less', color: 'less' });
      for (const attr of ['as', 'size', 'fontWeight', 'color']) {
        expect(el.hasAttribute(attr)).toBe(false);
      }
    });
  });

  describe('defaults', () => {
    it('adds the base class and the normal classes, and no styles, when no props are set', () => {
      const el = renderText();
      expect([...el.classList]).toEqual([
        styles.text,
        styles.fontWeightNormal,
        styles.colorNormal,
        styles.sizeNormal,
      ]);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it.each(SCALE_PROPS)('%s defaults to normal', (prop) => {
      expect(renderText().classList.contains(styles[`${prop}Normal`] as string)).toBe(true);
    });

    it('replaces the default when a variant is given', () => {
      const el = renderText({ size: 'more' });
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
      expect(el.classList.contains(styles.sizeNormal as string)).toBe(false);
    });

    it('is replaced by an escape-hatch value', () => {
      const el = renderText({ size: '2rem' });
      expect(el.style.fontSize).toBe('2rem');
      expect(el.classList.contains(styles.sizeNormal as string)).toBe(false);
    });
  });

  describe('variants', () => {
    // Guards against the prop list and Text.module.css drifting apart
    it.each(SCALE_PROPS.flatMap((p) => VARIANTS.map((v) => [p, v] as const)))(
      '%s="%s" applies its class and no inline style',
      (prop, variant) => {
        const className = styles[`${prop}${cap(variant)}`];
        expect(className).toBeTruthy();

        const el = renderText({ [prop]: variant });
        expect(el.classList.contains(className as string)).toBe(true);
        expect(el.getAttribute('style')).toBeFalsy();
      },
    );

    it('combines several props', () => {
      const el = renderText({ size: 'more', fontWeight: 'less', color: 'more' });
      expect([...el.classList]).toEqual([
        styles.text,
        styles.fontWeightLess,
        styles.colorMore,
        styles.sizeMore,
      ]);
    });
  });

  describe('escape hatch', () => {
    it('writes strings to the matching CSS property', () => {
      const el = renderText({ size: '1.5rem', fontWeight: '700', color: 'rebeccapurple' });
      expect(el.style.fontSize).toBe('1.5rem');
      expect(el.style.fontWeight).toBe('700');
      expect(el.style.color).toBe('rebeccapurple');
      expect([...el.classList]).toEqual([styles.text]);
    });

    it('accepts a CSS variable as a color', () => {
      expect(renderText({ color: 'var(--color-danger)' }).style.color).toBe('var(--color-danger)');
    });

    it('treats a size number as pixels', () => {
      expect(renderText({ size: 18 }).style.fontSize).toBe('18px');
    });

    it('treats a weight number as unitless, not pixels', () => {
      expect(renderText({ fontWeight: 700 }).style.fontWeight).toBe('700');
    });

    it('mixes a variant on one prop with an escape hatch on another', () => {
      const el = renderText({ size: 'more', fontWeight: '800' });
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
      expect(el.style.fontWeight).toBe('800');
    });
  });

  describe('className and style', () => {
    it('merges className with variant classes', () => {
      const el = renderText({ className: 'mine', size: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderText({ size: 10, color: 'red', style: { fontSize: 20, color: 'blue' } });
      expect(el.style.fontSize).toBe('20px');
      expect(el.style.color).toBe('blue');
    });
  });
});
