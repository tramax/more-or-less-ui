import { createRef, type ComponentProps } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Grid } from './Grid';
import styles from './Grid.module.css';
import boxStyles from '../Box/Box.module.css';
import gapStyles from '../_shared/Gap.module.css';

const renderGrid = (props: ComponentProps<typeof Grid> = {}) => {
  const { container } = render(<Grid {...props} />);
  return container.firstElementChild as HTMLDivElement;
};

const VARIANTS = ['less', 'normal', 'more'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

describe('Grid', () => {
  describe('element', () => {
    it('renders a div with children', () => {
      const el = renderGrid({ children: 'hi' });
      expect(el.tagName).toBe('DIV');
      expect(el.textContent).toBe('hi');
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Grid ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderGrid({ id: 'a', 'aria-label': 'b' });
      expect(el.id).toBe('a');
      expect(el.getAttribute('aria-label')).toBe('b');
    });

    it('does not leak its props to the DOM', () => {
      const el = renderGrid({ gap: 'more', columns: 3 });
      for (const attr of ['gap', 'columns']) expect(el.hasAttribute(attr)).toBe(false);
    });
  });

  describe('defaults', () => {
    it('is a single column with a normal gap and no styles', () => {
      const el = renderGrid();
      expect([...el.classList]).toEqual([styles.grid, gapStyles.gapNormal]);
      expect(el.getAttribute('style')).toBeFalsy();
    });
  });

  describe('columns as a count', () => {
    it('fixes the column count', () => {
      const el = renderGrid({ columns: 3 });
      expect(el.classList.contains(styles.fixed as string)).toBe(true);
      expect(el.classList.contains(styles.fit as string)).toBe(false);
      expect(el.style.getPropertyValue('--grid-columns')).toBe('3');
    });

    it.each([
      [0, '1'],
      [-2, '1'],
      [2.7, '2'],
    ])('makes %s a valid count (%s)', (columns, expected) => {
      expect(renderGrid({ columns }).style.getPropertyValue('--grid-columns')).toBe(expected);
    });

    it.each([NaN, Infinity])('ignores %s', (columns) => {
      const el = renderGrid({ columns });
      expect(el.classList.contains(styles.fixed as string)).toBe(false);
      expect(el.style.getPropertyValue('--grid-columns')).toBe('');
    });
  });

  describe('columns as a minimum width', () => {
    it('fits as many columns as the width allows', () => {
      const el = renderGrid({ columns: { minWidth: '14rem' } });
      expect(el.classList.contains(styles.fit as string)).toBe(true);
      expect(el.classList.contains(styles.fixed as string)).toBe(false);
      expect(el.style.getPropertyValue('--grid-column-min')).toBe('14rem');
    });

    it('takes any CSS length, including a percentage', () => {
      expect(
        renderGrid({ columns: { minWidth: '25%' } }).style.getPropertyValue('--grid-column-min'),
      ).toBe('25%');
    });

    it('treats a number as pixels', () => {
      expect(
        renderGrid({ columns: { minWidth: 240 } }).style.getPropertyValue('--grid-column-min'),
      ).toBe('240px');
    });

    it('ignores an empty width', () => {
      const el = renderGrid({ columns: { minWidth: '' } });
      expect(el.classList.contains(styles.fit as string)).toBe(false);
      expect(el.style.getPropertyValue('--grid-column-min')).toBe('');
    });
  });

  describe('gap', () => {
    it.each(VARIANTS)('gap="%s" applies its class and no inline style', (variant) => {
      const className = gapStyles[`gap${cap(variant)}`];
      const el = renderGrid({ gap: variant });
      expect(el.classList.contains(className as string)).toBe(true);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('takes an escape-hatch value, and 0 turns the gap off', () => {
      expect(renderGrid({ gap: '2rem' }).style.gap).toBe('2rem');
      const el = renderGrid({ gap: 0 });
      expect(el.style.gap).toBe('0px');
      expect(el.classList.contains(gapStyles.gapNormal as string)).toBe(false);
    });
  });

  describe('Box props', () => {
    it('takes padding and margin from Box', () => {
      const el = renderGrid({ padding: 'more', marginTop: 'less', margin: '2rem' });
      expect(el.classList.contains(boxStyles.paddingMore as string)).toBe(true);
      expect(el.classList.contains(boxStyles.marginTopLess as string)).toBe(true);
      expect(el.style.margin).toBe('2rem');
    });
  });

  describe('className and style', () => {
    it('merges className with the layout classes', () => {
      const el = renderGrid({ className: 'mine', columns: 2 });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.fixed as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderGrid({ gap: 10, style: { gap: 20, color: 'red' } });
      expect(el.style.gap).toBe('20px');
      expect(el.style.color).toBe('red');
    });
  });
});
