import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Text } from '../Text';
import { Title, type TitleElement } from './Title';
import placeholder from '../_shared/Placeholder.module.css';
import typeStyles from '../_shared/Type.module.css';
import textStyles from '../Text/Text.module.css';
import titleStyles from './Title.module.css';

// A class where TypeFrame takes it from: the root and `color*` from the shared module, the rest from
// Title's. One by one: under Vitest a CSS module is a Proxy with no keys to spread.
const classOf = (key: string) => (/^(root|color)/.test(key) ? typeStyles : titleStyles)[key];

const renderTitle = (props: ComponentProps<typeof Title> = {}) => {
  const { container } = render(<Title {...props} />);
  return container.firstElementChild as HTMLElement;
};

const SCALE_PROPS = ['size', 'fontWeight', 'color'] as const;
const VARIANTS = ['less', 'normal', 'more'] as const;
const LEVELS: TitleElement[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

afterEach(cleanup);

describe('Title', () => {
  describe('element', () => {
    it('renders an h2 heading with children by default', () => {
      render(<Title>Settings</Title>);
      const heading = screen.getByRole('heading', { name: 'Settings' });
      expect(heading.tagName).toBe('H2');
    });

    it.each(LEVELS)('renders <%s> for that `as`', (as) => {
      render(<Title as={as}>Heading</Title>);
      expect(screen.getByRole('heading', { level: Number(as[1]) }).tagName).toBe(as.toUpperCase());
    });

    it('is a heading only: other elements are a Text', () => {
      // @ts-expect-error Title renders h1-h6; a paragraph is a Text
      renderTitle({ as: 'p' });
    });

    it('keeps the size apart from the level', () => {
      const el = renderTitle({ as: 'h1' });
      expect(el.classList.contains(classOf('sizeNormal') as string)).toBe(true);
    });

    it('forwards the ref to the heading', () => {
      const ref = createRef<HTMLHeadingElement>();
      render(<Title ref={ref} as="h3" />);
      expect(ref.current?.tagName).toBe('H3');
    });

    it('passes native attributes through', () => {
      const el = renderTitle({ id: 'intro', title: 'Tooltip text' });
      expect(el.id).toBe('intro');
      expect(el.getAttribute('title')).toBe('Tooltip text');
    });

    it('does not leak its props to the DOM', () => {
      const el = renderTitle({ as: 'h3', size: 'more', fontWeight: 'less', color: 'less' });
      for (const attr of ['as', 'size', 'fontWeight', 'color']) {
        expect(el.hasAttribute(attr)).toBe(false);
      }
    });
  });

  describe('defaults', () => {
    it('adds the root, the title and the normal classes, and no styles, when no props are set', () => {
      const el = renderTitle();
      expect([...el.classList]).toEqual([
        classOf('root'),
        titleStyles.title,
        placeholder.placeholder,
        classOf('fontWeightNormal'),
        classOf('colorNormal'),
        classOf('sizeNormal'),
      ]);
      expect(el.getAttribute('style')).toBeFalsy();
    });

    it.each(SCALE_PROPS)('%s defaults to normal', (prop) => {
      expect(renderTitle().classList.contains(classOf(`${prop}Normal`) as string)).toBe(true);
    });
  });

  describe('variants', () => {
    // Guards against the prop list and Title.module.css drifting apart
    it.each(SCALE_PROPS.flatMap((p) => VARIANTS.map((v) => [p, v] as const)))(
      '%s="%s" applies its class and no inline style',
      (prop, variant) => {
        const className = classOf(`${prop}${cap(variant)}`);
        expect(className).toBeTruthy();

        const el = renderTitle({ [prop]: variant });
        expect(el.classList.contains(className as string)).toBe(true);
        expect(el.getAttribute('style')).toBeFalsy();
      },
    );

    // The point of Title: its size and weight read the title tokens, not Text's
    it.each(['sizeNormal', 'fontWeightNormal'])("uses its own %s class, not Text's", (key) => {
      const el = renderTitle();
      expect(el.classList.contains(titleStyles[key] as string)).toBe(true);
      expect(el.classList.contains(textStyles[key] as string)).toBe(false);
    });

    it('shares the color classes with Text', () => {
      render(
        <>
          <Title color="less">Heading</Title>
          <Text color="less">Body</Text>
        </>,
      );
      const className = typeStyles.colorLess as string;
      expect(screen.getByRole('heading').classList.contains(className)).toBe(true);
      expect(screen.getByText('Body').classList.contains(className)).toBe(true);
    });
  });

  describe('escape hatch', () => {
    it('writes strings to the matching CSS property', () => {
      const el = renderTitle({ size: '3rem', fontWeight: '800', color: 'rebeccapurple' });
      expect(el.style.fontSize).toBe('3rem');
      expect(el.style.fontWeight).toBe('800');
      expect(el.style.color).toBe('rebeccapurple');
      expect([...el.classList]).toEqual([
        classOf('root'),
        titleStyles.title,
        placeholder.placeholder,
      ]);
    });

    it('treats a size number as pixels and a weight number as unitless', () => {
      const el = renderTitle({ size: 48, fontWeight: 900 });
      expect(el.style.fontSize).toBe('48px');
      expect(el.style.fontWeight).toBe('900');
    });
  });

  describe('className and style', () => {
    it('merges className after its own classes', () => {
      const el = renderTitle({ className: 'mine', size: 'more' });
      expect(el.classList.contains('mine')).toBe(true);
      expect(el.classList.contains(classOf('sizeMore') as string)).toBe(true);
      expect(el.classList.contains(titleStyles.title as string)).toBe(true);
    });

    it('lets the style prop win over escape-hatch values, font family included', () => {
      const el = renderTitle({ size: 10, style: { fontSize: 20, fontFamily: 'Georgia' } });
      expect(el.style.fontSize).toBe('20px');
      expect(el.style.fontFamily).toBe('Georgia');
    });
  });

  describe('loading', () => {
    it('has the placeholder class, which does nothing until the region is aria-busy', () => {
      expect(renderTitle().classList.contains(placeholder.placeholder as string)).toBe(true);
    });

    it('passes aria-busy through, so a Title can be the busy region itself', () => {
      expect(renderTitle({ 'aria-busy': true }).getAttribute('aria-busy')).toBe('true');
    });
  });
});
