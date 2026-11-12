import { createRef, useState, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, render, fireEvent, cleanup, screen } from '@testing-library/react';
import { TextField, type TextFieldProps } from './TextField';
import styles from './TextField.module.css';
import frameStyles from '../_shared/TextFieldFrame.module.css';
import labelStyles from '../_shared/FieldLabel.module.css';
import errorStyles from '../_shared/FieldError.module.css';

// A partial of a union of props is a union of partials, which no single spread satisfies
const renderField = (props: Partial<ComponentProps<typeof TextField>> = {}) => {
  const { container } = render(<TextField label="Name" {...(props as TextFieldProps)} />);
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

    it.each(['email', 'password', 'search', 'tel', 'url', 'number'] as const)(
      'accepts type="%s"',
      (type) => {
        expect(renderField({ type }).input.type).toBe(type);
      },
    );

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

  describe('tooltip', () => {
    it('adds a button beside the label that explains the field, and leaves the field named by the label', () => {
      renderField({ tooltip: 'As on your passport' });
      expect(screen.getByRole('textbox', { name: 'Name' })).toBeTruthy();
      act(() => {
        screen.getByRole('button', { name: 'About Name' }).focus();
      });
      expect(screen.getByRole('tooltip', { hidden: true }).textContent).toBe('As on your passport');
    });

    it('has no button without one', () => {
      renderField();
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('does not leak to the DOM', () => {
      const { input } = renderField({ tooltip: 'x' });
      expect(input.hasAttribute('tooltip')).toBe(false);
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
    it('sets the native readonly attribute and leaves the tab order', () => {
      const { input } = renderField({ isReadOnly: true });
      expect(input.readOnly).toBe(true);
      expect(input.disabled).toBe(false);
      expect(input.tabIndex).toBe(-1);
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

  describe('type="password" with isRevealable', () => {
    const toggle = () => screen.getByRole('button', { name: /password$/ });

    it('has no button unless asked', () => {
      renderField({ type: 'password' });
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('shows the password as text and hides it again', () => {
      const { input } = renderField({
        type: 'password',
        isRevealable: true,
        defaultValue: 'secret',
      });
      expect(input.type).toBe('password');
      expect(toggle().getAttribute('aria-label')).toBe('Show password');

      fireEvent.click(toggle());
      expect(input.type).toBe('text');
      expect(input.value).toBe('secret');
      expect(toggle().getAttribute('aria-label')).toBe('Hide password');

      fireEvent.click(toggle());
      expect(input.type).toBe('password');
    });

    it('keeps the input focused when the button is pressed', () => {
      renderField({ type: 'password', isRevealable: true });
      // fireEvent returns false when the default action (what moves focus) was cancelled
      expect(fireEvent.mouseDown(toggle())).toBe(false);
    });

    it('is disabled with the field, and still works when read-only', () => {
      renderField({ type: 'password', isRevealable: true, isDisabled: true });
      expect((toggle() as HTMLButtonElement).disabled).toBe(true);
      cleanup();

      const { input } = renderField({ type: 'password', isRevealable: true, isReadOnly: true });
      fireEvent.click(toggle());
      expect(input.type).toBe('text');
    });

    it('puts the button beside the input in a wrapper, and makes room for it', () => {
      const { root, input } = renderField({ type: 'password', isRevealable: true });
      const wrapper = input.parentElement as HTMLElement;
      expect(wrapper.classList.contains(frameStyles.field as string)).toBe(true);
      expect(wrapper.style.getPropertyValue('--field-end-count')).toBe('1');
      expect(root.querySelector(`.${frameStyles.end}`)?.contains(toggle())).toBe(true);
    });

    it('adds no wrapper to a plain field', () => {
      const { root, input } = renderField();
      expect(input.parentElement).toBe(root);
    });

    it('keeps the ref and the consumer onChange', () => {
      const ref = createRef<HTMLInputElement>();
      const onChange = vi.fn();
      render(<TextField ref={ref} label="Pw" type="password" isRevealable onChange={onChange} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      fireEvent.change(ref.current as HTMLInputElement, { target: { value: 'x' } });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('type="number"', () => {
    const up = () => screen.getByRole('button', { name: 'Increase' }) as HTMLButtonElement;
    const down = () => screen.getByRole('button', { name: 'Decrease' }) as HTMLButtonElement;

    it('marks the input so the native spin buttons are hidden', () => {
      const numberClass = styles.number as string;
      expect(renderField({ type: 'number' }).input.classList.contains(numberClass)).toBe(true);
      cleanup();
      expect(renderField().input.classList.contains(numberClass)).toBe(false);
    });

    it('has no steppers unless asked', () => {
      renderField({ type: 'number' });
      expect(screen.queryByRole('button', { hidden: true })).toBeNull();
    });

    it('steps by `step` and reports it through onChange', () => {
      const onChange = vi.fn();
      const { input } = renderField({
        type: 'number',
        hasSteppers: true,
        defaultValue: 4,
        step: 2,
        onChange,
      });
      fireEvent.click(up());
      expect(input.value).toBe('6');
      fireEvent.click(down());
      fireEvent.click(down());
      expect(input.value).toBe('2');
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('steps a controlled field through its own state', () => {
      const Controlled = () => {
        const [value, setValue] = useState('1');
        return (
          <TextField
            label="Qty"
            type="number"
            hasSteppers
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };
      const { container } = render(<Controlled />);
      fireEvent.click(up());
      expect((container.querySelector('input') as HTMLInputElement).value).toBe('2');
    });

    it('steps from an empty field to the first value', () => {
      const { input } = renderField({ type: 'number', hasSteppers: true, min: 3 });
      fireEvent.click(up());
      expect(input.value).toBe('3');
    });

    it('disables a stepper at its limit, and enables it again', () => {
      const { input } = renderField({
        type: 'number',
        hasSteppers: true,
        defaultValue: 9,
        min: 0,
        max: 10,
        step: 3,
      });
      // 9 is the highest value on the step grid below 10
      expect(up().disabled).toBe(true);
      expect(down().disabled).toBe(false);
      fireEvent.click(down());
      expect(input.value).toBe('6');
      expect(up().disabled).toBe(false);
      fireEvent.change(input, { target: { value: '0' } });
      expect(down().disabled).toBe(true);
    });

    it('keeps both steppers out of the tab order, and makes room for two', () => {
      const { input } = renderField({ type: 'number', hasSteppers: true });
      expect(up().tabIndex).toBe(-1);
      expect(down().tabIndex).toBe(-1);
      expect((input.parentElement as HTMLElement).style.getPropertyValue('--field-end-count')).toBe(
        '2',
      );
    });

    it('disables both with the field', () => {
      renderField({ type: 'number', hasSteppers: true, isDisabled: true });
      expect(up().disabled).toBe(true);
      expect(down().disabled).toBe(true);
    });

    it('shows no steppers when read-only or with step="any"', () => {
      renderField({ type: 'number', hasSteppers: true, isReadOnly: true });
      expect(screen.queryByRole('button', { hidden: true })).toBeNull();
      cleanup();
      renderField({ type: 'number', hasSteppers: true, step: 'any' });
      expect(screen.queryByRole('button', { hidden: true })).toBeNull();
    });
  });
});
