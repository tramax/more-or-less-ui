import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import { Chip } from './Chip';
import styles from './Chip.module.css';

type RemovableProps = Partial<Extract<ComponentProps<typeof Chip>, { onRemove: () => void }>>;
type SelectableProps = Partial<
  Extract<ComponentProps<typeof Chip>, { onSelectedChange: (isSelected: boolean) => void }>
>;

const renderRemovable = ({ children = 'Date', ...props }: RemovableProps = {}) => {
  const { container } = render(
    <Chip onRemove={() => {}} {...props}>
      {children}
    </Chip>,
  );
  return container.firstElementChild as HTMLElement;
};

const renderSelectable = ({ children = 'Date', ...props }: SelectableProps = {}) => {
  const { container } = render(
    <Chip isSelected={false} onSelectedChange={() => {}} {...props}>
      {children}
    </Chip>,
  );
  return container.firstElementChild as HTMLButtonElement;
};

type StaticProps = Partial<
  Extract<ComponentProps<typeof Chip>, { onRemove?: never; onSelectedChange?: never }>
>;

const renderStatic = ({ children = 'Beta', ...props }: StaticProps = {}) => {
  const { container } = render(<Chip {...props}>{children}</Chip>);
  return container.firstElementChild as HTMLElement;
};

const VARIANTS = ['less', 'normal', 'more'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

afterEach(cleanup);

describe('Chip', () => {
  describe('static (no handler)', () => {
    it('renders an outlined span with its label', () => {
      const el = renderStatic({ children: 'Beta' });
      expect(el.tagName).toBe('SPAN');
      expect(el.textContent).toBe('Beta');
      expect([...el.classList].sort()).toEqual(
        [styles.chip, styles.sizeNormal, styles.static].sort(),
      );
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLElement>();
      render(<Chip ref={ref}>Beta</Chip>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('does nothing: no button, no role, no reaction class, clicks left alone', () => {
      const el = renderStatic();
      expect(el.querySelector('button')).toBeNull();
      expect(el.getAttribute('role')).toBeNull();
      expect(el.classList.contains(styles.interactive as string)).toBe(false);
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      el.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(fireEvent.mouseDown(el)).toBe(true);
    });

    it('passes DOM attributes through, and does not leak size', () => {
      const el = renderStatic({ id: 'a', title: 'b', size: 'more' });
      expect(el.id).toBe('a');
      expect(el.title).toBe('b');
      expect(el.hasAttribute('size')).toBe(false);
    });

    it('shows an icon before the label, hidden from assistive technology', () => {
      const el = renderStatic({ icon: <i data-testid="flag" /> });
      const flag = el.querySelector('[data-testid="flag"]') as HTMLElement;
      expect(flag.parentElement?.getAttribute('aria-hidden')).toBe('true');
      expect(el.firstElementChild).toBe(flag.parentElement);
    });
  });

  describe('removable', () => {
    it('renders a span with its label and a remove button named after it', () => {
      const el = renderRemovable({ children: 'Date' });
      expect(el.tagName).toBe('SPAN');
      expect(el.textContent).toBe('Date');
      expect(screen.getByRole('button', { name: 'Remove Date' })).toBeTruthy();
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLElement>();
      render(
        <Chip ref={ref} onRemove={() => {}}>
          Date
        </Chip>,
      );
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderRemovable({ id: 'a', title: 'b' });
      expect(el.id).toBe('a');
      expect(el.title).toBe('b');
    });

    it('adds the pill, the size, the fill and the reaction, and no styles', () => {
      const el = renderRemovable();
      expect([...el.classList].sort()).toEqual(
        [styles.chip, styles.sizeNormal, styles.removable, styles.interactive].sort(),
      );
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('does not leak its own props to the DOM', () => {
      const el = renderRemovable({ size: 'more', isInField: true, isDisabled: true });
      for (const attr of ['size', 'isinfield', 'isdisabled', 'onremove']) {
        expect(el.hasAttribute(attr)).toBe(false);
      }
    });

    it('calls onRemove when the button is clicked, and leaves the chip in place', () => {
      const onRemove = vi.fn();
      const el = renderRemovable({ onRemove });
      fireEvent.click(screen.getByRole('button', { name: 'Remove Date' }));
      expect(onRemove).toHaveBeenCalledOnce();
      expect(el.isConnected).toBe(true);
    });

    it('calls it once when the label is clicked: the whole chip is the target', () => {
      const onRemove = vi.fn();
      renderRemovable({ onRemove });
      fireEvent.click(screen.getByText('Date'));
      expect(onRemove).toHaveBeenCalledOnce();
    });

    it('marks the click handled, so a field around the chip does not act on it', () => {
      renderRemovable();
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      screen.getByText('Date').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('does not take focus from a field on mousedown', () => {
      renderRemovable();
      expect(fireEvent.mouseDown(screen.getByText('Date'))).toBe(false);
    });

    it('still calls the caller’s own onClick and onMouseDown', () => {
      const onClick = vi.fn();
      const onMouseDown = vi.fn();
      renderRemovable({ onClick, onMouseDown });
      fireEvent.mouseDown(screen.getByText('Date'));
      fireEvent.click(screen.getByText('Date'));
      expect(onMouseDown).toHaveBeenCalledOnce();
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('keeps the remove button in the tab order, and takes it out inside a field', () => {
      renderRemovable();
      expect(screen.getByRole('button').hasAttribute('tabindex')).toBe(false);
      cleanup();
      renderRemovable({ isInField: true });
      expect(screen.getByRole('button').getAttribute('tabindex')).toBe('-1');
    });

    describe('isDisabled', () => {
      it('dims it instead of reacting, and has no remove button', () => {
        const el = renderRemovable({ isDisabled: true });
        expect(el.classList.contains(styles.disabled as string)).toBe(true);
        expect(el.classList.contains(styles.interactive as string)).toBe(false);
        expect(el.querySelector('button')).toBeNull();
      });

      it('does not call onRemove, and leaves the click and mousedown alone', () => {
        const onRemove = vi.fn();
        renderRemovable({ onRemove, isDisabled: true });
        const down = fireEvent.mouseDown(screen.getByText('Date'));
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });
        screen.getByText('Date').dispatchEvent(click);
        expect(onRemove).not.toHaveBeenCalled();
        expect(down).toBe(true);
        expect(click.defaultPrevented).toBe(false);
      });
    });
  });

  describe('selectable', () => {
    it('renders a button that reports its state', () => {
      const el = renderSelectable({ isSelected: false });
      expect(el.tagName).toBe('BUTTON');
      expect(el.type).toBe('button');
      expect(el.getAttribute('aria-pressed')).toBe('false');
      cleanup();
      expect(renderSelectable({ isSelected: true }).getAttribute('aria-pressed')).toBe('true');
    });

    it('has no remove button, and is named by its label', () => {
      const el = renderSelectable({ children: 'Date' });
      expect(el.querySelector('button')).toBeNull();
      expect(screen.getByRole('button', { name: 'Date' })).toBe(el);
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLElement>();
      render(
        <Chip ref={ref} isSelected={false} onSelectedChange={() => {}}>
          Date
        </Chip>,
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('asks for the opposite state when clicked', () => {
      const onSelectedChange = vi.fn();
      renderSelectable({ isSelected: false, onSelectedChange });
      fireEvent.click(screen.getByRole('button'));
      expect(onSelectedChange).toHaveBeenLastCalledWith(true);
      cleanup();
      renderSelectable({ isSelected: true, onSelectedChange });
      fireEvent.click(screen.getByRole('button'));
      expect(onSelectedChange).toHaveBeenLastCalledWith(false);
    });

    it('follows isSelected: it does not flip itself', () => {
      const el = renderSelectable({ isSelected: false });
      fireEvent.click(el);
      expect(el.getAttribute('aria-pressed')).toBe('false');
    });

    it('still calls the caller’s own onClick', () => {
      const onClick = vi.fn();
      renderSelectable({ onClick });
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('has the field fill off and the brand fill on', () => {
      const off = renderSelectable({ isSelected: false });
      expect(off.classList.contains(styles.selectable as string)).toBe(true);
      expect(off.classList.contains(styles.selected as string)).toBe(false);
      cleanup();
      const on = renderSelectable({ isSelected: true });
      expect(on.classList.contains(styles.selected as string)).toBe(true);
    });

    it('shows the icon off, and a ✓ in its place on', () => {
      const icon = <i data-testid="flag" />;
      const off = renderSelectable({ isSelected: false, icon });
      expect(off.querySelector('[data-testid="flag"]')).not.toBeNull();
      expect(off.querySelector('svg')).toBeNull();
      cleanup();
      const on = renderSelectable({ isSelected: true, icon });
      expect(on.querySelector('[data-testid="flag"]')).toBeNull();
      expect(on.querySelector('svg')).not.toBeNull();
    });

    it('shows a ✓ on without an icon, and nothing before the label off', () => {
      expect(renderSelectable({ isSelected: true }).querySelector('svg')).not.toBeNull();
      cleanup();
      expect(renderSelectable({ isSelected: false }).querySelector('svg')).toBeNull();
    });

    describe('isDisabled', () => {
      it('is natively disabled, dimmed, and never asks for a change', () => {
        const onSelectedChange = vi.fn();
        const el = renderSelectable({ isDisabled: true, onSelectedChange });
        fireEvent.click(el);
        expect(el.disabled).toBe(true);
        expect(el.classList.contains(styles.disabled as string)).toBe(true);
        expect(el.classList.contains(styles.interactive as string)).toBe(false);
        expect(onSelectedChange).not.toHaveBeenCalled();
      });

      it('keeps the selected look and the ✓', () => {
        const el = renderSelectable({ isDisabled: true, isSelected: true });
        expect(el.classList.contains(styles.selected as string)).toBe(true);
        expect(el.querySelector('svg')).not.toBeNull();
      });
    });
  });

  describe('icon', () => {
    it('shows it before the label, hidden from assistive technology', () => {
      const el = renderRemovable({ icon: <i data-testid="flag" /> });
      const flag = el.querySelector('[data-testid="flag"]') as HTMLElement;
      expect(flag.parentElement?.getAttribute('aria-hidden')).toBe('true');
      expect(el.firstElementChild).toBe(flag.parentElement);
    });

    it('has no icon slot without one', () => {
      // The label is the first child; the × comes after it
      expect(renderRemovable({ children: 'Date' }).firstElementChild?.textContent).toBe('Date');
    });
  });

  describe('size', () => {
    it.each(VARIANTS)('size="%s" applies its class and no inline style', (variant) => {
      const el = renderRemovable({ size: variant });
      expect(el.classList.contains(styles[`size${cap(variant)}`] as string)).toBe(true);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('writes an escape-hatch size to font-size, and "1em" takes the surrounding size', () => {
      const el = renderRemovable({ size: '1.5rem' });
      expect(el.style.fontSize).toBe('1.5rem');
      expect(el.classList.contains(styles.sizeNormal as string)).toBe(false);
      cleanup();
      expect(renderRemovable({ size: '1em' }).style.fontSize).toBe('1em');
    });

    it('treats numbers as pixels', () => {
      expect(renderRemovable({ size: 18 }).style.fontSize).toBe('18px');
    });

    it('has no borderRadius or background to set: the shape and the fill are fixed', () => {
      // @ts-expect-error not props
      const el = renderRemovable({ borderRadius: '2px', background: 'red' });
      expect(el.style.borderRadius).toBe('');
      expect(el.style.background).toBe('');
    });
  });

  describe('className and style', () => {
    it('merges className with the classes', () => {
      const el = renderRemovable({ className: 'mine', size: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
    });

    it('lets the style prop win over an escape-hatch size', () => {
      const el = renderRemovable({ size: 20, style: { fontSize: 30, color: 'red' } });
      expect(el.style.fontSize).toBe('30px');
      expect(el.style.color).toBe('red');
    });
  });
});
