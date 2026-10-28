import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Button } from './Button';
import styles from './Button.module.css';

const renderButton = (props: ComponentProps<typeof Button> = {}) => {
  const { container } = render(<Button {...props} />);
  return container.firstElementChild as HTMLButtonElement;
};

const SCALE_PROPS = ['size', 'background'] as const;
const VARIANTS = ['less', 'normal', 'more'] as const;
const DEFAULT_CLASSES = [styles.button, styles.backgroundNormal, styles.sizeNormal];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

afterEach(cleanup);

describe('Button', () => {
  describe('element', () => {
    it('renders a button with children', () => {
      const el = renderButton({ children: 'hi' });
      expect(el.tagName).toBe('BUTTON');
      expect(el.textContent).toBe('hi');
    });

    it('defaults to type="button" so it does not submit forms', () => {
      expect(renderButton().type).toBe('button');
    });

    it('accepts type="submit"', () => {
      expect(renderButton({ type: 'submit' }).type).toBe('submit');
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderButton({ id: 'a', 'aria-label': 'b', name: 'c' });
      expect(el.id).toBe('a');
      expect(el.getAttribute('aria-label')).toBe('b');
      expect(el.name).toBe('c');
    });

    it('adds only the default classes and no styles when no scale props are set', () => {
      const el = renderButton();
      expect([...el.classList]).toEqual(DEFAULT_CLASSES);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('does not leak scale or state props to the DOM', () => {
      const el = renderButton({ size: 'more', isDisabled: true, isLoading: true });
      for (const attr of ['size', 'isdisabled', 'isloading'])
        expect(el.hasAttribute(attr)).toBe(false);
    });
  });

  describe('variants', () => {
    // Guards against the prop list and Button.module.css drifting apart
    it.each(SCALE_PROPS.flatMap((p) => VARIANTS.map((v) => [p, v] as const)))(
      '%s="%s" applies its class and no inline style',
      (prop, variant) => {
        const className = styles[`${prop}${cap(variant)}`];
        expect(className).toBeTruthy();

        const el = renderButton({ [prop]: variant });
        expect(el.classList.contains(className as string)).toBe(true);
        expect(el.getAttribute('style')).toBeFalsy();
      },
    );

    it('replaces the default when a variant is given', () => {
      const el = renderButton({ size: 'more' });
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
      expect(el.classList.contains(styles.sizeNormal as string)).toBe(false);
    });
  });

  describe('escape hatch', () => {
    it('writes size to font-size', () => {
      const el = renderButton({ size: '1.5rem' });
      expect(el.style.fontSize).toBe('1.5rem');
      expect(el.classList.contains(styles.sizeNormal as string)).toBe(false);
    });

    it('treats numbers as pixels', () => {
      expect(renderButton({ size: 18 }).style.fontSize).toBe('18px');
    });

    it('writes background to the matching CSS property', () => {
      const el = renderButton({ background: 'red' });
      expect(el.style.background).toBe('red');
      expect(el.classList.contains(styles.backgroundNormal as string)).toBe(false);
    });
  });

  describe('className and style', () => {
    it('merges className with variant classes', () => {
      const el = renderButton({ className: 'mine', size: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderButton({ size: 20, style: { fontSize: 30, color: 'red' } });
      expect(el.style.fontSize).toBe('30px');
      expect(el.style.color).toBe('red');
    });
  });

  describe('onClick', () => {
    it('is called with the event', () => {
      const onClick = vi.fn();
      fireEvent.click(renderButton({ onClick }));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0]?.[0]).toMatchObject({ type: 'click' });
    });
  });

  describe('isDisabled', () => {
    it('sets the native disabled attribute', () => {
      expect(renderButton({ isDisabled: true }).disabled).toBe(true);
      expect(renderButton().disabled).toBe(false);
    });

    it('does not call onClick', () => {
      const onClick = vi.fn();
      fireEvent.click(renderButton({ isDisabled: true, onClick }));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('icon', () => {
    const star = <svg data-testid="star" />;

    it('shows the icon before the children, hidden from assistive tech', () => {
      const el = renderButton({ icon: star, children: 'Save' });
      const slot = el.querySelector('[aria-hidden="true"]');
      expect(slot?.querySelector('[data-testid="star"]')).not.toBeNull();
      expect(slot?.nextSibling?.textContent).toBe('Save');
      expect(el.textContent).toBe('Save');
    });

    it('is a normal button when it has text next to the icon', () => {
      expect(
        renderButton({ icon: star, children: 'Save' }).classList.contains(
          styles.iconOnly as string,
        ),
      ).toBe(false);
    });

    it('is an icon-only button without children, named by aria-label', () => {
      const { getByRole } = render(<Button icon={star} aria-label="Favourite" />);
      const el = getByRole('button', { name: 'Favourite' });
      expect(el.classList.contains(styles.iconOnly as string)).toBe(true);
    });

    it('can be named by aria-labelledby', () => {
      const { getByRole } = render(
        <>
          <span id="n">Favourite</span>
          <Button icon={star} aria-labelledby="n" />
        </>,
      );
      expect(getByRole('button', { name: 'Favourite' })).not.toBeNull();
    });

    it('treats empty children as none', () => {
      const el = renderButton({ icon: star, children: false as never, 'aria-label': 'x' });
      expect(el.classList.contains(styles.iconOnly as string)).toBe(true);
    });

    it('renders no slot without an icon, and does not leak the prop to the DOM', () => {
      const el = renderButton({ children: 'Save' });
      expect(el.querySelector('[aria-hidden="true"]')).toBeNull();
      expect(renderButton({ icon: star, children: 'Save' }).hasAttribute('icon')).toBe(false);
    });

    it('still shows the spinner when loading, and keeps its name', () => {
      const { getByRole } = render(<Button icon={star} aria-label="Favourite" isLoading />);
      const el = getByRole('button', { name: 'Favourite' });
      expect(el.querySelector(`.${styles.spinner}`)).not.toBeNull();
    });

    it('needs a name when there is no text (type-level)', () => {
      render(
        <>
          {/* @ts-expect-error an icon-only button needs aria-label or aria-labelledby */}
          <Button icon={star} />
          <Button icon={star} aria-label="ok" />
          <Button icon={star}>ok</Button>
        </>,
      );
    });
  });

  describe('isLoading', () => {
    it('shows a spinner hidden from assistive tech, and marks the button busy', () => {
      const el = renderButton({ isLoading: true, children: 'Save' });
      const spinner = el.querySelector(`.${styles.spinner}`);
      expect(spinner).not.toBeNull();
      expect(spinner?.getAttribute('aria-hidden')).toBe('true');
      expect(el.getAttribute('aria-busy')).toBe('true');
      expect(el.classList.contains(styles.loading as string)).toBe(true);
    });

    it('keeps the content, so the width and the accessible name survive', () => {
      expect(renderButton({ isLoading: true, children: 'Save' }).textContent).toBe('Save');
    });

    it('stays focusable: aria-disabled, not disabled', () => {
      const el = renderButton({ isLoading: true });
      expect(el.disabled).toBe(false);
      expect(el.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not call onClick', () => {
      const onClick = vi.fn();
      fireEvent.click(renderButton({ isLoading: true, onClick }));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('prevents a loading submit button from submitting its form', () => {
      const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
      const { getByRole } = render(
        <form onSubmit={onSubmit}>
          <Button type="submit" isLoading>
            Save
          </Button>
        </form>,
      );
      fireEvent.click(getByRole('button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('has no spinner and no aria state when not loading', () => {
      const el = renderButton({ children: 'Save' });
      expect(el.querySelector(`.${styles.spinner}`)).toBeNull();
      expect(el.hasAttribute('aria-busy')).toBe(false);
      expect(el.hasAttribute('aria-disabled')).toBe(false);
    });
  });
});
