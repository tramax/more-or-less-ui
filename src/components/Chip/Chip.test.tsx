import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import { Chip } from './Chip';
import styles from './Chip.module.css';

const renderChip = (props: Partial<ComponentProps<typeof Chip>> = {}) => {
  const { container } = render(<Chip {...props}>{props.children ?? 'Beta'}</Chip>);
  return container.firstElementChild as HTMLSpanElement;
};

const SCALE_PROPS = ['size', 'borderRadius', 'background'] as const;
const VARIANTS = ['less', 'normal', 'more'] as const;
const DEFAULT_CLASSES = [
  styles.chip,
  styles.sizeNormal,
  styles.borderRadiusNormal,
  styles.backgroundNormal,
];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

afterEach(cleanup);

describe('Chip', () => {
  describe('element', () => {
    it('renders a span with its label', () => {
      const el = renderChip({ children: 'Beta' });
      expect(el.tagName).toBe('SPAN');
      expect(el.textContent).toBe('Beta');
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLSpanElement>();
      render(<Chip ref={ref}>Beta</Chip>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderChip({ id: 'a', title: 'b' });
      expect(el.id).toBe('a');
      expect(el.title).toBe('b');
    });

    it('adds only the default classes and no styles when no props are set', () => {
      const el = renderChip();
      expect([...el.classList].sort()).toEqual([...DEFAULT_CLASSES].sort());
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('does not leak its own props to the DOM', () => {
      const el = renderChip({
        size: 'more',
        borderRadius: 'more',
        background: 'more',
        onRemove: vi.fn(),
        isInField: true,
      });
      for (const attr of ['size', 'borderradius', 'background', 'onremove', 'isinfield']) {
        expect(el.hasAttribute(attr)).toBe(false);
      }
    });
  });

  describe('icon', () => {
    it('shows it before the label, hidden from assistive technology', () => {
      const el = renderChip({ icon: <i data-testid="flag" /> });
      const flag = el.querySelector('[data-testid="flag"]') as HTMLElement;
      expect(flag.parentElement?.getAttribute('aria-hidden')).toBe('true');
      expect(el.firstElementChild).toBe(flag.parentElement);
    });

    it('has no icon slot without one', () => {
      expect(renderChip().querySelector('[aria-hidden="true"]')).toBeNull();
    });
  });

  describe('onRemove', () => {
    it('has no button, and is not clickable, without it', () => {
      const el = renderChip();
      expect(el.querySelector('button')).toBeNull();
      expect(el.classList.contains(styles.removable as string)).toBe(false);
    });

    it('shows a button named after the label', () => {
      renderChip({ children: 'Date', onRemove: vi.fn() });
      expect(screen.getByRole('button', { name: 'Remove Date' })).toBeTruthy();
    });

    it('calls it when the button is clicked, and leaves the chip in place', () => {
      const onRemove = vi.fn();
      const el = renderChip({ onRemove });
      fireEvent.click(screen.getByRole('button', { name: 'Remove Beta' }));
      expect(onRemove).toHaveBeenCalledOnce();
      expect(el.isConnected).toBe(true);
    });

    it('calls it once when the label is clicked: the whole chip is the target', () => {
      const onRemove = vi.fn();
      renderChip({ onRemove });
      fireEvent.click(screen.getByText('Beta'));
      expect(onRemove).toHaveBeenCalledOnce();
    });

    it('marks the click handled, so a field around the chip does not act on it', () => {
      const onRemove = vi.fn();
      renderChip({ onRemove });
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      screen.getByText('Beta').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('does not take focus from a field on mousedown', () => {
      renderChip({ onRemove: vi.fn() });
      const notPrevented = fireEvent.mouseDown(screen.getByText('Beta'));
      expect(notPrevented).toBe(false);
    });

    it('still calls the caller’s own onClick and onMouseDown', () => {
      const onClick = vi.fn();
      const onMouseDown = vi.fn();
      renderChip({ onRemove: vi.fn(), onClick, onMouseDown });
      fireEvent.mouseDown(screen.getByText('Beta'));
      fireEvent.click(screen.getByText('Beta'));
      expect(onMouseDown).toHaveBeenCalledOnce();
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('leaves clicks alone without onRemove', () => {
      renderChip();
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      screen.getByText('Beta').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('keyboard', () => {
    it('keeps the remove button in the tab order', () => {
      renderChip({ onRemove: vi.fn() });
      expect(screen.getByRole('button').hasAttribute('tabindex')).toBe(false);
    });

    it('takes it out of the tab order inside a field', () => {
      renderChip({ onRemove: vi.fn(), isInField: true });
      expect(screen.getByRole('button').getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('variants', () => {
    // Guards against the prop list and Chip.module.css drifting apart
    it.each(SCALE_PROPS.flatMap((p) => VARIANTS.map((v) => [p, v] as const)))(
      '%s="%s" applies its class and no inline style',
      (prop, variant) => {
        const className = styles[`${prop}${cap(variant)}`];
        expect(className).toBeTruthy();

        const el = renderChip({ [prop]: variant });
        expect(el.classList.contains(className as string)).toBe(true);
        expect(el.getAttribute('style')).toBeFalsy();
      },
    );

    it('replaces the default when a variant is given', () => {
      const el = renderChip({ background: 'more' });
      expect(el.classList.contains(styles.backgroundMore as string)).toBe(true);
      expect(el.classList.contains(styles.backgroundNormal as string)).toBe(false);
    });
  });

  describe('escape hatch', () => {
    it('writes size to font-size, and "1em" takes the surrounding size', () => {
      const el = renderChip({ size: '1.5rem' });
      expect(el.style.fontSize).toBe('1.5rem');
      expect(el.classList.contains(styles.sizeNormal as string)).toBe(false);
      expect(renderChip({ size: '1em' }).style.fontSize).toBe('1em');
    });

    it('treats numbers as pixels', () => {
      expect(renderChip({ size: 18 }).style.fontSize).toBe('18px');
    });

    it('writes borderRadius to the matching CSS property, without a class', () => {
      const el = renderChip({ borderRadius: '50%' });
      expect(el.style.borderRadius).toBe('50%');
      expect(el.classList.contains(styles.borderRadiusNormal as string)).toBe(false);
    });

    it('writes background to the matching CSS property', () => {
      const el = renderChip({ background: 'red' });
      expect(el.style.background).toBe('red');
      expect(el.classList.contains(styles.backgroundNormal as string)).toBe(false);
    });
  });

  describe('className and style', () => {
    it('merges className with variant classes', () => {
      const el = renderChip({ className: 'mine', size: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderChip({ size: 20, style: { fontSize: 30, color: 'red' } });
      expect(el.style.fontSize).toBe('30px');
      expect(el.style.color).toBe('red');
    });
  });
});
