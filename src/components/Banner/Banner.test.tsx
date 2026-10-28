import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Banner } from './Banner';
import styles from './Banner.module.css';

const renderBanner = (props: ComponentProps<typeof Banner> = {}) => {
  const { container } = render(<Banner {...props} />);
  return container.firstElementChild as HTMLDivElement;
};

const SCALE_PROPS = ['size', 'background'] as const;
const VARIANTS = ['less', 'normal', 'more'] as const;
const DEFAULT_CLASSES = [styles.banner, styles.backgroundNormal, styles.sizeNormal];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

afterEach(cleanup);

describe('Banner', () => {
  describe('element', () => {
    it('renders a polite live region with its children', () => {
      const el = renderBanner({ children: 'Back on Monday' });
      expect(el.tagName).toBe('DIV');
      expect(el.getAttribute('role')).toBe('status');
      expect(el.textContent).toBe('Back on Monday');
    });

    it('lets the caller choose another role', () => {
      expect(renderBanner({ role: 'alert' }).getAttribute('role')).toBe('alert');
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Banner ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderBanner({ id: 'a', 'aria-label': 'b' });
      expect(el.id).toBe('a');
      expect(el.getAttribute('aria-label')).toBe('b');
    });

    it('adds only the default classes and no styles when no scale props are set', () => {
      const el = renderBanner();
      expect([...el.classList]).toEqual(DEFAULT_CLASSES);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('does not leak scale or callback props to the DOM', () => {
      const el = renderBanner({ size: 'more', background: 'more', title: 'T', onDismiss: vi.fn() });
      for (const attr of ['size', 'background', 'title', 'ondismiss']) {
        expect(el.hasAttribute(attr)).toBe(false);
      }
    });
  });

  describe('title and message', () => {
    it('shows the title above the message', () => {
      const el = renderBanner({ title: 'Downtime', children: 'Sunday 02:00' });
      const [title, message] = el.querySelector(`.${styles.body}`)?.children ?? [];
      expect(title?.textContent).toBe('Downtime');
      expect(message?.textContent).toBe('Sunday 02:00');
    });

    it('renders neither element when it has neither', () => {
      const el = renderBanner();
      expect(el.querySelector(`.${styles.title}`)).toBeNull();
      expect(el.querySelector(`.${styles.message}`)).toBeNull();
    });

    it('can have a title alone', () => {
      const el = renderBanner({ title: 'Saved' });
      expect(el.querySelector(`.${styles.title}`)?.textContent).toBe('Saved');
      expect(el.querySelector(`.${styles.message}`)).toBeNull();
    });
  });

  describe('variants', () => {
    // Guards against the prop list and Banner.module.css drifting apart
    it.each(SCALE_PROPS.flatMap((p) => VARIANTS.map((v) => [p, v] as const)))(
      '%s="%s" applies its class and no inline style',
      (prop, variant) => {
        const className = styles[`${prop}${cap(variant)}`];
        expect(className).toBeTruthy();

        const el = renderBanner({ [prop]: variant });
        expect(el.classList.contains(className as string)).toBe(true);
        expect(el.getAttribute('style')).toBeFalsy();
      },
    );

    it('replaces the default when a variant is given', () => {
      const el = renderBanner({ background: 'more' });
      expect(el.classList.contains(styles.backgroundMore as string)).toBe(true);
      expect(el.classList.contains(styles.backgroundNormal as string)).toBe(false);
    });
  });

  describe('escape hatch', () => {
    it('writes size to font-size', () => {
      const el = renderBanner({ size: '1.5rem' });
      expect(el.style.fontSize).toBe('1.5rem');
      expect(el.classList.contains(styles.sizeNormal as string)).toBe(false);
    });

    it('treats numbers as pixels', () => {
      expect(renderBanner({ size: 18 }).style.fontSize).toBe('18px');
    });

    it('writes background to the matching CSS property', () => {
      const el = renderBanner({ background: 'red' });
      expect(el.style.background).toBe('red');
      expect(el.classList.contains(styles.backgroundNormal as string)).toBe(false);
    });
  });

  describe('className and style', () => {
    it('merges className with variant classes', () => {
      const el = renderBanner({ className: 'mine', size: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderBanner({ size: 20, style: { fontSize: 30, color: 'red' } });
      expect(el.style.fontSize).toBe('30px');
      expect(el.style.color).toBe('red');
    });
  });

  describe('onDismiss', () => {
    it('has no button without it', () => {
      expect(renderBanner({ children: 'x' }).querySelector('button')).toBeNull();
    });

    it('shows a named button that calls it, and leaves the banner in place', () => {
      const onDismiss = vi.fn();
      const { getByRole, container } = render(<Banner onDismiss={onDismiss}>x</Banner>);
      fireEvent.click(getByRole('button', { name: 'Dismiss' }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(container.firstElementChild).not.toBeNull();
    });

    it('is a plain button, so it never submits a form', () => {
      const { getByRole } = render(<Banner onDismiss={vi.fn()} />);
      expect((getByRole('button') as HTMLButtonElement).type).toBe('button');
    });

    it('hides the icon from assistive tech', () => {
      const { getByRole } = render(<Banner onDismiss={vi.fn()} />);
      expect(getByRole('button').querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
