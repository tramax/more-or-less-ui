import { createRef, useState, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Textarea } from './Textarea';
import styles from './Textarea.module.css';
import frameStyles from '../_shared/TextFieldFrame.module.css';
import labelStyles from '../_shared/FieldLabel.module.css';
import errorStyles from '../_shared/FieldError.module.css';

// The label, error, id and state wiring is TextFieldFrame's, and TextField's tests cover it in full.
// These check that Textarea is hooked up to it, and test what is its own.

const renderField = (props: Partial<ComponentProps<typeof Textarea>> = {}) => {
  const { container } = render(<Textarea label="Notes" {...props} />);
  return {
    root: container.firstElementChild as HTMLDivElement,
    textarea: container.querySelector('textarea') as HTMLTextAreaElement,
    label: container.querySelector('label'),
  };
};

const VARIANTS = ['less', 'normal', 'more'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

afterEach(cleanup);

describe('Textarea', () => {
  describe('element', () => {
    it('renders a textarea', () => {
      expect(renderField().textarea.tagName).toBe('TEXTAREA');
    });

    it('forwards the ref to the textarea', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} label="Notes" />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('passes DOM attributes through to the textarea', () => {
      const { textarea } = renderField({ name: 'n', placeholder: 'p', maxLength: 5 });
      expect(textarea.name).toBe('n');
      expect(textarea.placeholder).toBe('p');
      expect(textarea.maxLength).toBe(5);
    });

    it('adds only the default classes and no styles when no scale props are set', () => {
      const { root } = renderField();
      expect([...root.classList]).toEqual([frameStyles.root, frameStyles.sizeNormal, styles.root]);
      expect(root.getAttribute('style')).toBeFalsy();
    });

    it('does not leak scale or state props to the DOM', () => {
      const { textarea } = renderField({
        size: 'more',
        resize: 'none',
        isDisabled: true,
        isRequired: true,
        error: 'x',
      });
      for (const attr of ['size', 'resize', 'isdisabled', 'isrequired', 'error'])
        expect(textarea.hasAttribute(attr)).toBe(false);
    });
  });

  describe('rows', () => {
    it('shows 3 rows by default', () => {
      expect(renderField().textarea.rows).toBe(3);
    });

    it('takes a given number', () => {
      expect(renderField({ rows: 6 }).textarea.rows).toBe(6);
    });
  });

  describe('resize', () => {
    it('is vertical by default', () => {
      const { textarea } = renderField();
      expect(textarea.classList.contains(styles.resizeVertical as string)).toBe(true);
      expect(textarea.classList.contains(styles.resizeNone as string)).toBe(false);
    });

    it('can be turned off', () => {
      const { textarea } = renderField({ resize: 'none' });
      expect(textarea.classList.contains(styles.resizeNone as string)).toBe(true);
      expect(textarea.classList.contains(styles.resizeVertical as string)).toBe(false);
    });
  });

  describe('label', () => {
    it('is linked to the textarea', () => {
      const { textarea, label } = renderField();
      expect(label?.htmlFor).toBe(textarea.id);
      expect(textarea.id).toBeTruthy();
    });

    it('uses a given id', () => {
      const { textarea, label } = renderField({ id: 'mine' });
      expect(textarea.id).toBe('mine');
      expect(label?.htmlFor).toBe('mine');
    });

    it('is optional when aria-label names the field', () => {
      const { container } = render(<Textarea aria-label="Comment" />);
      expect(container.querySelector('label')).toBeNull();
      expect(container.querySelector('textarea')?.getAttribute('aria-label')).toBe('Comment');
    });
  });

  describe('variants', () => {
    // Guards against the prop list and Textarea.module.css drifting apart
    it.each(VARIANTS)('size="%s" applies its class and no inline style', (variant) => {
      const className = frameStyles[`size${cap(variant)}`];
      expect(className).toBeTruthy();

      const { root } = renderField({ size: variant });
      expect(root.classList.contains(className as string)).toBe(true);
      expect(root.getAttribute('style')).toBeFalsy();
    });

    it('writes an escape-hatch size to font-size on the root', () => {
      const { root } = renderField({ size: '1.5rem' });
      expect(root.style.fontSize).toBe('1.5rem');
      expect(root.classList.contains(frameStyles.sizeNormal as string)).toBe(false);
    });
  });

  describe('className and style', () => {
    it('go on the root, not the textarea', () => {
      const { root, textarea } = renderField({ className: 'mine', style: { color: 'red' } });
      expect(root.classList.contains('mine')).toBe(true);
      expect(root.style.color).toBe('red');
      expect(textarea.classList.contains('mine')).toBe(false);
    });
  });

  describe('value', () => {
    it('calls onChange with the event', () => {
      const onChange = vi.fn();
      fireEvent.change(renderField({ onChange }).textarea, { target: { value: 'a' } });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]?.[0]).toMatchObject({ type: 'change' });
    });

    it('works uncontrolled', () => {
      const { textarea } = renderField({ defaultValue: 'start' });
      expect(textarea.value).toBe('start');
      fireEvent.change(textarea, { target: { value: 'next' } });
      expect(textarea.value).toBe('next');
    });

    it('works controlled', () => {
      const Controlled = () => {
        const [value, setValue] = useState('a');
        return <Textarea label="Notes" value={value} onChange={(e) => setValue(e.target.value)} />;
      };
      const { container } = render(<Controlled />);
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'b' } });
      expect(textarea.value).toBe('b');
    });
  });

  describe('state', () => {
    it('isDisabled sets the native attribute and dims the field', () => {
      const { root, textarea } = renderField({ isDisabled: true });
      expect(textarea.disabled).toBe(true);
      expect(root.classList.contains(frameStyles.disabled as string)).toBe(true);
    });

    it('isReadOnly sets the native attribute and stays focusable', () => {
      const { textarea } = renderField({ isReadOnly: true });
      expect(textarea.readOnly).toBe(true);
      expect(textarea.disabled).toBe(false);
    });

    it('isRequired sets native required and shows an asterisk hidden from assistive tech', () => {
      const { textarea, label } = renderField({ isRequired: true });
      expect(textarea.required).toBe(true);
      expect(label?.querySelector(`.${labelStyles.asterisk}`)?.getAttribute('aria-hidden')).toBe(
        'true',
      );
    });

    it('all are off by default', () => {
      const { root, textarea } = renderField();
      expect(textarea.disabled).toBe(false);
      expect(textarea.readOnly).toBe(false);
      expect(textarea.required).toBe(false);
      expect(root.classList.contains(frameStyles.disabled as string)).toBe(false);
    });
  });

  describe('error', () => {
    it('marks the textarea invalid and shows the message, linked by aria-describedby', () => {
      const { root, textarea } = renderField({ error: 'Add a note', 'aria-describedby': 'other' });
      const message = root.querySelector(`.${errorStyles.error}`);
      expect(message?.textContent).toBe('Add a note');
      expect(textarea.getAttribute('aria-invalid')).toBe('true');
      expect(textarea.getAttribute('aria-describedby')).toBe(`other ${message?.id}`);
      expect(root.classList.contains(frameStyles.invalid as string)).toBe(true);
    });

    it('adds no message and no aria-invalid without an error', () => {
      const { root, textarea } = renderField();
      expect(root.querySelector(`.${errorStyles.error}`)).toBeNull();
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
      expect(textarea.hasAttribute('aria-describedby')).toBe(false);
    });
  });
});
