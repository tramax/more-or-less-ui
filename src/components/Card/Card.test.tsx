import { createRef, type ComponentProps } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card';
import styles from './Card.module.css';
import boxStyles from '../Box/Box.module.css';

const renderCard = (props: ComponentProps<typeof Card> = {}) => {
  const { container } = render(<Card {...props} />);
  return container.firstElementChild as HTMLDivElement;
};

// Padding is Box's, so its classes come from Box.module.css
const SURFACE_PROPS = ['borderRadius', 'boxShadow', 'background'] as const;
const VARIANTS = ['less', 'normal', 'more'] as const;
const DEFAULT_CLASSES = [
  boxStyles.paddingNormal,
  styles.borderRadiusNormal,
  styles.boxShadowNormal,
  styles.backgroundNormal,
];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

describe('Card', () => {
  describe('element', () => {
    it('renders a div with children', () => {
      const el = renderCard({ children: 'hi' });
      expect(el.tagName).toBe('DIV');
      expect(el.textContent).toBe('hi');
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Card ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderCard({ id: 'a', 'aria-label': 'b' });
      expect(el.id).toBe('a');
      expect(el.getAttribute('aria-label')).toBe('b');
    });

    it('adds only the default classes and no styles when no props are set', () => {
      const el = renderCard();
      expect([...el.classList]).toEqual(DEFAULT_CLASSES);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('does not leak scale props to the DOM', () => {
      const el = renderCard({ padding: 'more', boxShadow: 'less' });
      expect(el.hasAttribute('padding')).toBe(false);
      expect(el.hasAttribute('boxShadow')).toBe(false);
    });
  });

  describe('variants', () => {
    // Guards against the prop list and Card.module.css drifting apart
    it.each(SURFACE_PROPS.flatMap((p) => VARIANTS.map((v) => [p, v] as const)))(
      '%s="%s" applies its class and no inline style',
      (prop, variant) => {
        const className = styles[`${prop}${cap(variant)}`];
        expect(className).toBeTruthy();

        const el = renderCard({ [prop]: variant });
        expect(el.classList.contains(className as string)).toBe(true);
        expect(el.getAttribute('style')).toBeFalsy();
      },
    );

    it.each(VARIANTS)('padding="%s" applies Box\'s class', (variant) => {
      const el = renderCard({ padding: variant });
      expect(el.classList.contains(boxStyles[`padding${cap(variant)}`] as string)).toBe(true);
    });

    it('combines several props', () => {
      const el = renderCard({ padding: 'more', borderRadius: 'less' });
      expect([...el.classList]).toEqual([
        boxStyles.paddingMore,
        styles.borderRadiusLess,
        styles.boxShadowNormal,
        styles.backgroundNormal,
      ]);
    });
  });

  describe('defaults', () => {
    it.each(SURFACE_PROPS)('%s defaults to normal', (prop) => {
      expect(renderCard().classList.contains(styles[`${prop}Normal`] as string)).toBe(true);
    });

    it('padding defaults to normal', () => {
      expect(renderCard().classList.contains(boxStyles.paddingNormal as string)).toBe(true);
    });

    it.each(['paddingLeft', 'paddingTop'] as const)(
      '%s has no default, it only overrides its shorthand',
      (prop) => {
        const el = renderCard();
        for (const variant of VARIANTS) {
          expect(el.classList.contains(boxStyles[`${prop}${cap(variant)}`] as string)).toBe(false);
        }
      },
    );

    it('replaces the default when a variant is given', () => {
      const el = renderCard({ padding: 'more' });
      expect(el.classList.contains(boxStyles.paddingMore as string)).toBe(true);
      expect(el.classList.contains(boxStyles.paddingNormal as string)).toBe(false);
    });

    it('is replaced by an escape-hatch value, including 0', () => {
      const el = renderCard({ padding: 0, background: 'red' });
      expect(el.style.padding).toBe('0px');
      expect(el.style.background).toBe('red');
      expect(el.classList.contains(boxStyles.paddingNormal as string)).toBe(false);
      expect(el.classList.contains(styles.backgroundNormal as string)).toBe(false);
    });

    it('lets a per-side prop override the default shorthand', () => {
      const el = renderCard({ paddingLeft: 'less' });
      expect(el.classList.contains(boxStyles.paddingNormal as string)).toBe(true);
      expect(el.classList.contains(boxStyles.paddingLeftLess as string)).toBe(true);
    });

    it('turns the background off with "less" (transparent)', () => {
      const el = renderCard({ background: 'less' });
      expect(el.classList.contains(styles.backgroundLess as string)).toBe(true);
    });

    it('turns the shadow off with an escape-hatch value', () => {
      const el = renderCard({ boxShadow: 'none' });
      expect(el.style.boxShadow).toBe('none');
      expect(el.classList.contains(styles.boxShadowNormal as string)).toBe(false);
    });
  });

  describe('escape hatch', () => {
    it('writes strings to the matching CSS property', () => {
      const el = renderCard({ padding: '12px 24px', borderRadius: '50%' });
      expect(el.style.padding).toBe('12px 24px');
      expect(el.style.borderRadius).toBe('50%');
      expect([...el.classList]).toEqual([styles.boxShadowNormal, styles.backgroundNormal]);
    });

    it('treats numbers as pixels', () => {
      const el = renderCard({ paddingTop: 300, paddingBottom: 20, borderRadius: 8 });
      expect(el.style.paddingTop).toBe('300px');
      expect(el.style.paddingBottom).toBe('20px');
      expect(el.style.borderRadius).toBe('8px');
    });

    it('mixes a variant on one prop with an escape hatch on another', () => {
      const el = renderCard({ padding: 'more', borderRadius: '50%' });
      expect(el.classList.contains(boxStyles.paddingMore as string)).toBe(true);
      expect(el.style.borderRadius).toBe('50%');
    });
  });

  describe('className and style', () => {
    it('merges className with variant classes', () => {
      const el = renderCard({ className: 'mine', padding: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(boxStyles.paddingMore as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderCard({ borderRadius: 100, style: { borderRadius: 200, color: 'red' } });
      expect(el.style.borderRadius).toBe('200px');
      expect(el.style.color).toBe('red');
    });
  });
});
