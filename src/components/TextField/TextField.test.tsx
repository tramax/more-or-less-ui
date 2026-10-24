import { createRef, useState, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { TextField } from './TextField';
import styles from './TextField.module.css';
import frameStyles from '../_shared/TextFieldFrame.module.css';
import labelStyles from '../_shared/FieldLabel.module.css';
import errorStyles from '../_shared/FieldError.module.css';

const renderField = (props: Partial<ComponentProps<typeof TextField>> = {}) => {
  const { container } = render(<TextField label="Name" {...props} />);
  return {
    root: container.firstElementChild as HTMLDivElement,
    input: container.querySelector('input') as HTMLInputElement,
    label: container.querySelector('label'),
  };
};

const VARIANTS = ['less', 'normal', 'more'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

afterEach(cleanup);

describe('TextField', () => {
  describe('element', () => {
    it('renders a text input', () => {
      const { input } = renderField();
      expect(input.tagName).toBe('INPUT');
      expect(input.type).toBe('text');
    });

    it.each(['email', 'password', 'search', 'tel', 'url'] as const)('accepts type="%s"', (type) => {
      expect(renderField({ type }).input.type).toBe(type);
    });

    it('forwards the ref to the input', () => {
      const ref = createRef<HTMLInputElement>();
      render(<TextField ref={ref} label="Name" />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('passes DOM attributes through to the input', () => {
      const { input } = renderField({ name: 'n', placeholder: 'p', maxLength: 5 });
      expect(input.name).toBe('n');
      expect(input.placeholder).toBe('p');
      expect(input.maxLength).toBe(5);
    });

    it('adds only the default classes and no styles when no scale props are set', () => {
      const { root } = renderField();
      expect([...root.classList]).toEqual([frameStyles.root, frameStyles.sizeNormal, styles.root]);
      expect(root.getAttribute('style')).toBeFalsy();
    });

    it('does not leak scale or state props to the DOM', () => {
      const { input } = renderField({
        size: 'more',
        isDisabled: true,
        isRequired: true,
        error: 'x',
      });
      for (const attr of ['size', 'isdisabled', 'isrequired', 'error'])
        expect(input.hasAttribute(attr)).toBe(false);
    });
  });

  describe('label', () => {
    it('is linked to the input', () => {
      const { input, label } = renderField();
      expect(label?.htmlFor).toBe(input.id);
      expect(input.id).toBeTruthy();
    });

    it('uses a given id', () => {
      const { input, label } = renderField({ id: 'mine' });
      expect(input.id).toBe('mine');
      expect(label?.htmlFor).toBe('mine');
    });

    it('is optional when aria-label names the field', () => {
      const { container } = render(<TextField aria-label="Search" />);
      expect(container.querySelector('label')).toBeNull();
      expect(container.querySelector('input')?.getAttribute('aria-label')).toBe('Search');
    });
  });

  describe('variants', () => {
    // Guards against the prop list and TextField.module.css drifting apart
    it.each(VARIANTS)('size="%s" applies its class and no inline style', (variant) => {
      const className = frameStyles[`size${cap(variant)}`];
      expect(className).toBeTruthy();

      const { root } = renderField({ size: variant });
      expect(root.classList.contains(className as string)).toBe(true);
      expect(root.getAttribute('style')).toBeFalsy();
    });

    it('replaces the default when a variant is given', () => {
      const { root } = renderField({ size: 'more' });
      expect(root.classList.contains(frameStyles.sizeMore as string)).toBe(true);
      expect(root.classList.contains(frameStyles.sizeNormal as string)).toBe(false);
    });
  });

  describe('escape hatch', () => {
    it('writes size to font-size on the root', () => {
      const { root } = renderField({ size: '1.5rem' });
      expect(root.style.fontSize).toBe('1.5rem');
      expect(root.classList.contains(frameStyles.sizeNormal as string)).toBe(false);
    });

    it('treats numbers as pixels', () => {
      expect(renderField({ size: 18 }).root.style.fontSize).toBe('18px');
    });
  });

  describe('className and style', () => {
    it('go on the root, merged with the variant classes', () => {
      const { root, input } = renderField({ className: 'mine', size: 'more' });
      expect(root.classList.contains('mine')).toBe(true);
      expect(root.classList.contains(frameStyles.sizeMore as string)).toBe(true);
      expect(input.classList.contains('mine')).toBe(false);
    });

    it('lets the style prop win over escape-hatch values', () => {
      const { root } = renderField({ size: 20, style: { fontSize: 30, color: 'red' } });
      expect(root.style.fontSize).toBe('30px');
      expect(root.style.color).toBe('red');
    });
  });

  describe('value', () => {
    it('calls onChange with the event', () => {
      const onChange = vi.fn();
      const { input } = renderField({ onChange });
      fireEvent.change(input, { target: { value: 'a' } });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]?.[0]).toMatchObject({ type: 'change' });
    });

    it('works uncontrolled', () => {
      const { input } = renderField({ defaultValue: 'start' });
      expect(input.value).toBe('start');
      fireEvent.change(input, { target: { value: 'next' } });
      expect(input.value).toBe('next');
    });

    it('works controlled', () => {
      const Controlled = () => {
        const [value, setValue] = useState('a');
        return <TextField label="Name" value={value} onChange={(e) => setValue(e.target.value)} />;
      };
      const { container } = render(<Controlled />);
      const input = container.querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'b' } });
      expect(input.value).toBe('b');
    });
  });

  describe('isDisabled', () => {
    it('sets the native disabled attribute and dims the field', () => {
      const { root, input } = renderField({ isDisabled: true });
      expect(input.disabled).toBe(true);
      expect(root.classList.contains(frameStyles.disabled as string)).toBe(true);
    });

    it('is off by default', () => {
      const { root, input } = renderField();
      expect(input.disabled).toBe(false);
      expect(root.classList.contains(frameStyles.disabled as string)).toBe(false);
    });
  });

  describe('isReadOnly', () => {
    it('sets the native readonly attribute and stays focusable', () => {
      const { input } = renderField({ isReadOnly: true });
      expect(input.readOnly).toBe(true);
      expect(input.disabled).toBe(false);
    });
  });

  describe('isRequired', () => {
    it('sets native required and shows an asterisk hidden from assistive tech', () => {
      const { input, label } = renderField({ isRequired: true });
      expect(input.required).toBe(true);
      const asterisk = label?.querySelector(`.${labelStyles.asterisk}`);
      expect(asterisk?.getAttribute('aria-hidden')).toBe('true');
    });

    it('has neither when not required', () => {
      const { input, label } = renderField();
      expect(input.required).toBe(false);
      expect(label?.querySelector(`.${labelStyles.asterisk}`)).toBeNull();
    });
  });

  describe('error', () => {
    it('marks the input invalid and shows the message, linked by aria-describedby', () => {
      const { root, input } = renderField({ error: 'Enter your name' });
      const message = root.querySelector(`.${errorStyles.error}`);
      expect(message?.textContent).toBe('Enter your name');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe(message?.id);
      expect(root.classList.contains(frameStyles.invalid as string)).toBe(true);
    });

    it('gives the message an icon hidden from assistive tech', () => {
      const { root } = renderField({ error: 'Oops' });
      expect(root.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('keeps a consumer aria-describedby alongside the message', () => {
      const { root, input } = renderField({ error: 'Oops', 'aria-describedby': 'other' });
      const message = root.querySelector(`.${errorStyles.error}`);
      expect(input.getAttribute('aria-describedby')).toBe(`other ${message?.id}`);
    });

    it('adds no message, no aria-invalid and no aria-describedby without an error', () => {
      const { root, input } = renderField();
      expect(root.querySelector(`.${errorStyles.error}`)).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(input.hasAttribute('aria-describedby')).toBe(false);
    });

    it('keeps a consumer aria-describedby when there is no error', () => {
      expect(
        renderField({ 'aria-describedby': 'other' }).input.getAttribute('aria-describedby'),
      ).toBe('other');
    });
  });
});
