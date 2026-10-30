import { createRef, type ComponentProps } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Stack } from './Stack';
import styles from './Stack.module.css';
import boxStyles from '../Box/Box.module.css';
import gapStyles from '../_shared/Gap.module.css';

const renderStack = (props: ComponentProps<typeof Stack> = {}) => {
  const { container } = render(<Stack {...props} />);
  return container.firstElementChild as HTMLDivElement;
};

const VARIANTS = ['less', 'normal', 'more'] as const;
const ALIGN = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
const JUSTIFY = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

describe('Stack', () => {
  describe('element', () => {
    it('renders a div with children', () => {
      const el = renderStack({ children: 'hi' });
      expect(el.tagName).toBe('DIV');
      expect(el.textContent).toBe('hi');
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Stack ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderStack({ id: 'a', 'aria-label': 'b' });
      expect(el.id).toBe('a');
      expect(el.getAttribute('aria-label')).toBe('b');
    });

    it('does not leak its props to the DOM', () => {
      const el = renderStack({
        gap: 'more',
        direction: 'row',
        align: 'center',
        justify: 'end',
        wrap: true,
      });
      for (const attr of ['gap', 'direction', 'align', 'justify', 'wrap']) {
        expect(el.hasAttribute(attr)).toBe(false);
      }
    });
  });

  describe('defaults', () => {
    it('is a column with a normal gap and no styles', () => {
      const el = renderStack();
      expect([...el.classList]).toEqual([styles.stack, styles.column, gapStyles.gapNormal]);
      expect(el.getAttribute('style')).toBeFalsy();
    });
  });

  describe('direction', () => {
    it('lays out a row', () => {
      const el = renderStack({ direction: 'row' });
      expect(el.classList.contains(styles.row as string)).toBe(true);
      expect(el.classList.contains(styles.column as string)).toBe(false);
    });
  });

  describe('gap', () => {
    // Guards against the prop list and Stack.module.css drifting apart
    it.each(VARIANTS)('gap="%s" applies its class and no inline style', (variant) => {
      const className = gapStyles[`gap${cap(variant)}`];
      expect(className).toBeTruthy();

      const el = renderStack({ gap: variant });
      expect(el.classList.contains(className as string)).toBe(true);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('replaces the default when a variant is given', () => {
      const el = renderStack({ gap: 'more' });
      expect(el.classList.contains(gapStyles.gapNormal as string)).toBe(false);
    });

    it('takes an escape-hatch value, numbers as pixels', () => {
      expect(renderStack({ gap: '2rem' }).style.gap).toBe('2rem');
      const el = renderStack({ gap: 12 });
      expect(el.style.gap).toBe('12px');
      expect(el.classList.contains(gapStyles.gapNormal as string)).toBe(false);
    });

    it('turns the gap off with 0', () => {
      const el = renderStack({ gap: 0 });
      expect(el.style.gap).toBe('0px');
      expect(el.classList.contains(gapStyles.gapNormal as string)).toBe(false);
    });
  });

  describe('align and justify', () => {
    it('set no alignment class by default', () => {
      const el = renderStack();
      for (const v of ALIGN)
        expect(el.classList.contains(styles[`align${cap(v)}`] as string)).toBe(false);
      for (const v of JUSTIFY)
        expect(el.classList.contains(styles[`justify${cap(v)}`] as string)).toBe(false);
    });

    it.each(ALIGN)('align="%s" applies its class', (value) => {
      const className = styles[`align${cap(value)}`];
      expect(className).toBeTruthy();
      expect(renderStack({ align: value }).classList.contains(className as string)).toBe(true);
    });

    it.each(JUSTIFY)('justify="%s" applies its class', (value) => {
      const className = styles[`justify${cap(value)}`];
      expect(className).toBeTruthy();
      expect(renderStack({ justify: value }).classList.contains(className as string)).toBe(true);
    });
  });

  describe('wrap', () => {
    it('does not wrap by default', () => {
      expect(renderStack().classList.contains(styles.wrap as string)).toBe(false);
    });

    it('wraps with `wrap`', () => {
      expect(renderStack({ wrap: true }).classList.contains(styles.wrap as string)).toBe(true);
    });

    it('does not wrap with wrap={false}', () => {
      expect(renderStack({ wrap: false }).classList.contains(styles.wrap as string)).toBe(false);
    });
  });

  describe('Box props', () => {
    it('takes padding and margin from Box', () => {
      const el = renderStack({ padding: 'more', marginTop: 'less', margin: '2rem' });
      expect(el.classList.contains(boxStyles.paddingMore as string)).toBe(true);
      expect(el.classList.contains(boxStyles.marginTopLess as string)).toBe(true);
      expect(el.style.margin).toBe('2rem');
    });

    it('has no padding or margin by default', () => {
      const el = renderStack();
      expect([...el.classList].some((c) => Object.values(boxStyles).includes(c))).toBe(false);
    });
  });

  describe('className and style', () => {
    it('merges className with the layout classes', () => {
      const el = renderStack({ className: 'mine', direction: 'row' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.row as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderStack({ gap: 10, style: { gap: 20, color: 'red' } });
      expect(el.style.gap).toBe('20px');
      expect(el.style.color).toBe('red');
    });
  });
});
