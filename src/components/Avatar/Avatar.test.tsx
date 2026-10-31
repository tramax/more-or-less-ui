import { createRef, type ComponentProps, type CSSProperties } from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Avatar, getHue, getInitials } from './Avatar';
import styles from './Avatar.module.css';

const renderAvatar = (props: ComponentProps<typeof Avatar> = {}) => {
  const { container } = render(<Avatar {...props} />);
  return container.firstElementChild as HTMLSpanElement;
};

const VARIANTS = ['less', 'normal', 'more'] as const;
const DEFAULT_CLASSES = [styles.avatar, styles.sizeNormal];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const hueOf = (el: HTMLElement) => el.style.getPropertyValue('--avatar-hue');

afterEach(cleanup);

describe('getInitials', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['ada', 'A'],
    ['  grace   brewster  murray hopper ', 'GH'],
    ['élodie dupont', 'ÉD'],
    ['😀 Smile', '😀S'],
    ['', ''],
    ['   ', ''],
  ])('%j → %j', (name, initials) => {
    expect(getInitials(name)).toBe(initials);
  });
});

describe('getHue', () => {
  it('is a whole number of degrees', () => {
    for (const name of ['Ada', 'Grace Hopper', '😀', 'x'.repeat(500)]) {
      const hue = getHue(name);
      expect(Number.isInteger(hue)).toBe(true);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  it('is the same for the same name, whatever its case and spacing', () => {
    expect(getHue('Ada Lovelace')).toBe(getHue('Ada Lovelace'));
    expect(getHue('Ada Lovelace')).toBe(getHue('  ada   LOVELACE '));
  });

  it('spreads different names around the wheel', () => {
    const names = ['Ada', 'Adam', 'Alan', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara'];
    expect(new Set(names.map(getHue)).size).toBeGreaterThanOrEqual(7);
  });
});

describe('Avatar', () => {
  describe('element', () => {
    it('renders a span that is an image', () => {
      const el = renderAvatar({ name: 'Ada Lovelace' });
      expect(el.tagName).toBe('SPAN');
      expect(el.getAttribute('role')).toBe('img');
    });

    it('forwards the ref', () => {
      const ref = createRef<HTMLSpanElement>();
      render(<Avatar ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('passes DOM attributes through', () => {
      const el = renderAvatar({ id: 'a', title: 'b', name: 'N' });
      expect(el.id).toBe('a');
      expect(el.title).toBe('b');
    });

    it('adds only the default classes and no styles when no props are set', () => {
      const el = renderAvatar();
      expect([...el.classList]).toEqual([...DEFAULT_CLASSES, styles.anonymous]);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it('does not leak its own props to the DOM', () => {
      const el = renderAvatar({ size: 'more', name: 'N', alt: 'A', src: 'x' });
      for (const attr of ['size', 'name', 'alt', 'src']) {
        expect(el.hasAttribute(attr)).toBe(false);
      }
    });
  });

  describe('accessible name', () => {
    it('is the name', () => {
      expect(renderAvatar({ name: 'Ada Lovelace' }).getAttribute('aria-label')).toBe(
        'Ada Lovelace',
      );
    });

    it('is the alt, which wins over the name', () => {
      const el = renderAvatar({ name: 'Ada Lovelace', alt: 'Ada, smiling' });
      expect(el.getAttribute('aria-label')).toBe('Ada, smiling');
    });

    it('is hidden from assistive technology with alt=""', () => {
      const el = renderAvatar({ name: 'Ada Lovelace', alt: '' });
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.hasAttribute('aria-label')).toBe(false);
    });

    it('is hidden when it has no name at all', () => {
      expect(renderAvatar().getAttribute('aria-hidden')).toBe('true');
    });

    it('is not hidden when the caller names it another way', () => {
      const el = renderAvatar({ 'aria-label': 'Account' });
      expect(el.getAttribute('aria-label')).toBe('Account');
      expect(el.hasAttribute('aria-hidden')).toBe(false);

      const labelled = renderAvatar({ 'aria-labelledby': 'someone' });
      expect(labelled.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  describe('fallback', () => {
    it('shows the initials of the name', () => {
      expect(renderAvatar({ name: 'Ada Lovelace' }).textContent).toBe('AL');
    });

    it('shows the children in place of the initials', () => {
      const el = renderAvatar({ name: 'Ada Lovelace', children: <b>★</b> });
      expect(el.textContent).toBe('★');
    });

    it('shows a glyph with no name and no children', () => {
      const el = renderAvatar();
      expect(el.textContent).toBe('');
      expect(el.querySelector(`.${styles.glyph}`)).not.toBeNull();
    });

    it('shows no glyph when there are initials', () => {
      expect(renderAvatar({ name: 'Ada' }).querySelector(`.${styles.glyph}`)).toBeNull();
    });
  });

  describe('picture', () => {
    const image = (el: HTMLElement) => el.querySelector('img') as HTMLImageElement | null;

    it('has no <img> without a src', () => {
      expect(image(renderAvatar({ name: 'Ada' }))).toBeNull();
    });

    it('renders a decorative <img>: the avatar carries the name', () => {
      const el = renderAvatar({ src: '/ada.png', name: 'Ada Lovelace' });
      expect(image(el)?.getAttribute('src')).toBe('/ada.png');
      expect(image(el)?.getAttribute('alt')).toBe('');
    });

    it('keeps the fallback under a transparent picture while it loads', () => {
      const el = renderAvatar({ src: '/ada.png', name: 'Ada Lovelace' });
      expect(image(el)?.classList.contains(styles.loading as string)).toBe(true);
      expect(el.textContent).toBe('AL');
    });

    it('shows the picture and drops the fallback once it has loaded', () => {
      const el = renderAvatar({ src: '/ada.png', name: 'Ada Lovelace' });
      fireEvent.load(image(el) as HTMLImageElement);
      expect(image(el)?.classList.contains(styles.loading as string)).toBe(false);
      expect(el.textContent).toBe('');
    });

    it('drops the picture and keeps the fallback when it fails', () => {
      const el = renderAvatar({ src: '/gone.png', name: 'Ada Lovelace' });
      fireEvent.error(image(el) as HTMLImageElement);
      expect(image(el)).toBeNull();
      expect(el.textContent).toBe('AL');
    });

    it('starts over when the src changes after a failure', () => {
      const { container, rerender } = render(<Avatar src="/gone.png" name="Ada Lovelace" />);
      fireEvent.error(container.querySelector('img') as HTMLImageElement);
      expect(container.querySelector('img')).toBeNull();

      rerender(<Avatar src="/ada.png" name="Ada Lovelace" />);
      expect(container.querySelector('img')?.getAttribute('src')).toBe('/ada.png');
    });
  });

  describe('color', () => {
    it('gets its hue from the name, as a custom property the CSS turns into a color', () => {
      const el = renderAvatar({ name: 'Ada Lovelace' });
      expect(hueOf(el)).toBe(String(getHue('Ada Lovelace')));
      expect(el.classList.contains(styles.anonymous as string)).toBe(false);
    });

    it('gives the same name the same color, and does not take it from `alt`', () => {
      expect(hueOf(renderAvatar({ name: 'Ada', alt: 'x' }))).toBe(
        hueOf(renderAvatar({ name: 'ada' })),
      );
    });

    it.each([undefined, '', '   '])('has no hue for the name %j', (name) => {
      const el = renderAvatar({ name });
      expect(hueOf(el)).toBe('');
      expect(el.classList.contains(styles.anonymous as string)).toBe(true);
    });

    it('lets the style prop set a color of its own', () => {
      expect(renderAvatar({ name: 'Ada', style: { background: 'red' } }).style.background).toBe(
        'red',
      );
    });
  });

  describe('written name and description', () => {
    const circle = (el: HTMLElement) => el.querySelector(`.${styles.avatar}`) as HTMLElement;

    it('is just the circle by default: the root is the image', () => {
      const el = renderAvatar({ name: 'Ada Lovelace' });
      expect(el.classList.contains(styles.avatar as string)).toBe(true);
      expect(el.classList.contains(styles.withText as string)).toBe(false);
      expect(el.querySelector(`.${styles.avatar}`)).toBeNull();
      expect(el.textContent).toBe('AL');
    });

    it('writes the name beside the circle with isTextShown', () => {
      const el = renderAvatar({ name: 'Ada Lovelace', isTextShown: true });
      expect(el.classList.contains(styles.withText as string)).toBe(true);
      expect(el.classList.contains(styles.avatar as string)).toBe(false);
      expect(circle(el).textContent).toBe('AL');
      expect(el.textContent).toBe('ALAda Lovelace');
    });

    it('shows neither the name nor the description unless asked', () => {
      const el = renderAvatar({ name: 'Ada Lovelace', description: 'Mathematician' });
      expect(el.classList.contains(styles.withText as string)).toBe(false);
      expect(el.textContent).toBe('AL');
    });

    it('puts the description after the name', () => {
      const el = renderAvatar({
        name: 'Ada Lovelace',
        description: 'Mathematician',
        isTextShown: true,
      });
      expect(el.textContent).toBe('ALAda LovelaceMathematician');
      const [nameEl, descriptionEl] = circle(el).nextElementSibling?.children ?? [];
      expect(nameEl?.textContent).toBe('Ada Lovelace');
      expect(descriptionEl?.textContent).toBe('Mathematician');
    });

    it('is decorative to a screen reader, since the name is written beside it', () => {
      const c = circle(renderAvatar({ name: 'Ada Lovelace', isTextShown: true }));
      expect(c.getAttribute('aria-hidden')).toBe('true');
      expect(c.hasAttribute('aria-label')).toBe(false);
    });

    it('still names the circle when the caller gives an alt', () => {
      const c = circle(
        renderAvatar({ name: 'Ada Lovelace', isTextShown: true, alt: 'Ada, smiling' }),
      );
      expect(c.getAttribute('aria-label')).toBe('Ada, smiling');
      expect(c.hasAttribute('aria-hidden')).toBe(false);
    });

    it('puts the ref, className, size and style on the row, and the hue with them', () => {
      const ref = createRef<HTMLSpanElement>();
      const { container } = render(
        <Avatar ref={ref} name="Ada" isTextShown className="mine" size="more" style={{ gap: 3 }} />,
      );
      const el = container.firstElementChild as HTMLElement;
      expect(ref.current).toBe(el);
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
      expect(el.style.gap).toBe('3px');
      expect(hueOf(el)).toBe(String(getHue('Ada')));
      expect(circle(el).getAttribute('style')).toBeFalsy();
    });

    it('lets the caller pick the hue', () => {
      const style = { '--avatar-hue': 200 } as CSSProperties;
      expect(hueOf(renderAvatar({ name: 'Ada', isTextShown: true, style }))).toBe('200');
      expect(hueOf(renderAvatar({ name: 'Ada', style }))).toBe('200');
    });

    it.each([undefined, '', '   '])('writes nothing for the name %j', (name) => {
      const el = renderAvatar({ name, isTextShown: true });
      expect(el.classList.contains(styles.withText as string)).toBe(false);
      expect(el.classList.contains(styles.avatar as string)).toBe(true);
    });

    it('does not leak its props to the DOM', () => {
      const el = renderAvatar({ name: 'Ada', description: 'D', isTextShown: true });
      for (const attr of ['description', 'istextshown', 'name']) {
        expect(el.hasAttribute(attr)).toBe(false);
      }
    });
  });

  describe('variants', () => {
    // Guards against the prop list and Avatar.module.css drifting apart
    it.each(VARIANTS)('size="%s" applies its class and no inline style', (variant) => {
      const className = styles[`size${cap(variant)}`];
      expect(className).toBeTruthy();

      const el = renderAvatar({ size: variant });
      expect(el.classList.contains(className as string)).toBe(true);
      expect(el.getAttribute('style')).toBeFalsy();
    });
  });

  describe('escape hatch', () => {
    it('writes size to font-size', () => {
      const el = renderAvatar({ size: '1.5rem' });
      expect(el.style.fontSize).toBe('1.5rem');
      expect(el.classList.contains(styles.sizeNormal as string)).toBe(false);
    });

    it('treats numbers as pixels', () => {
      expect(renderAvatar({ size: 18 }).style.fontSize).toBe('18px');
    });
  });

  describe('className and style', () => {
    it('merges className with variant classes', () => {
      const el = renderAvatar({ className: 'mine', size: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(styles.sizeMore as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const el = renderAvatar({ size: 20, style: { fontSize: 30, color: 'red' } });
      expect(el.style.fontSize).toBe('30px');
      expect(el.style.color).toBe('red');
    });
  });
});
