import { createRef, useState, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import { Radio, type RadioOption } from './Radio';
import shared from '../_shared/OptionGroup.module.css';
import labelStyles from '../_shared/FieldLabel.module.css';

const OPTIONS: RadioOption[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', description: 'Yellow' },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Date' },
];

const renderGroup = (props: Partial<ComponentProps<typeof Radio>> = {}) => {
  const { container } = render(<Radio label="Fruit" options={OPTIONS} {...props} />);
  const inputs = () => [...container.querySelectorAll('input')] as HTMLInputElement[];
  return {
    container,
    root: container.firstElementChild as HTMLFieldSetElement,
    inputs,
    input: (value: string) => inputs().find((i) => i.value === value) as HTMLInputElement,
    checkedValues: () =>
      inputs()
        .filter((i) => i.checked)
        .map((i) => i.value),
  };
};

afterEach(cleanup);

describe('Radio', () => {
  describe('element', () => {
    it('renders a radiogroup fieldset with a legend and one radio per option', () => {
      const { root, inputs } = renderGroup();
      expect(root.tagName).toBe('FIELDSET');
      expect(screen.getByRole('radiogroup', { name: 'Fruit' })).toBe(root);
      expect(root.querySelector('legend')?.textContent).toBe('Fruit');
      expect(inputs()).toHaveLength(4);
      expect(inputs().every((i) => i.type === 'radio')).toBe(true);
    });

    it('labels each input with its option label', () => {
      const { container } = renderGroup();
      const labels = [...container.querySelectorAll('label')].map((l) => l.textContent);
      expect(labels).toEqual(['Apple', 'BananaYellow', 'Cherry', 'Date']);
    });

    it('forwards the ref and className to the fieldset', () => {
      const ref = createRef<HTMLFieldSetElement>();
      const { container } = render(
        <Radio ref={ref} label="Fruit" options={OPTIONS} className="mine" />,
      );
      expect(ref.current).toBe(container.firstElementChild);
      expect(ref.current?.classList.contains('mine')).toBe(true);
    });

    it('has no legend when aria-label names the group', () => {
      const { root } = renderGroup({ label: undefined, 'aria-label': 'Fruit' } as never);
      expect(root.querySelector('legend')).toBeNull();
      expect(root.getAttribute('aria-label')).toBe('Fruit');
    });

    it('does not leak state props to the DOM', () => {
      const { root } = renderGroup({ isDisabled: true, isRequired: true, error: 'x' });
      for (const attr of ['isdisabled', 'isrequired', 'error', 'options'])
        expect(root.hasAttribute(attr)).toBe(false);
    });
  });

  describe('orientation', () => {
    it('is vertical by default', () => {
      const options = renderGroup().root.querySelector(`.${shared.options}`);
      expect(options?.classList.contains(shared.vertical as string)).toBe(true);
    });

    it.each(['horizontal', 'vertical'] as const)('applies %s', (orientation) => {
      const options = renderGroup({ orientation }).root.querySelector(`.${shared.options}`);
      expect(options?.classList.contains(shared[orientation] as string)).toBe(true);
    });
  });

  describe('value', () => {
    it('selects nothing by default', () => {
      expect(renderGroup().checkedValues()).toEqual([]);
    });

    it('works uncontrolled, starting from defaultValue', () => {
      const { input, checkedValues } = renderGroup({ defaultValue: 'b' });
      expect(checkedValues()).toEqual(['b']);
      fireEvent.click(input('c'));
      expect(checkedValues()).toEqual(['c']);
    });

    it('works controlled', () => {
      const Controlled = () => {
        const [value, setValue] = useState<string | null>('a');
        return <Radio label="Fruit" options={OPTIONS} value={value} onChange={setValue} />;
      };
      const { container } = render(<Controlled />);
      const input = (v: string) =>
        container.querySelector(`input[value="${v}"]`) as HTMLInputElement;
      fireEvent.click(input('d'));
      expect(input('d').checked).toBe(true);
      expect(input('a').checked).toBe(false);
    });

    it('does not change by itself when controlled', () => {
      const { input, checkedValues } = renderGroup({ value: 'a' });
      fireEvent.click(input('b'));
      expect(checkedValues()).toEqual(['a']);
    });

    it('selects nothing for a controlled null, and for a value that matches no option', () => {
      expect(renderGroup({ value: null }).checkedValues()).toEqual([]);
      cleanup();
      expect(renderGroup({ value: 'nope' }).checkedValues()).toEqual([]);
    });

    it('stays controlled with nothing selected when value is null', () => {
      const { input, checkedValues } = renderGroup({ value: null });
      fireEvent.click(input('a'));
      expect(checkedValues()).toEqual([]);
    });

    it('calls onChange with the selected value, and not when it is selected again', () => {
      const onChange = vi.fn();
      const { input } = renderGroup({ onChange });
      fireEvent.click(input('c'));
      fireEvent.click(input('c'));
      fireEvent.click(input('a'));
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(1, 'c');
      expect(onChange).toHaveBeenNthCalledWith(2, 'a');
    });
  });

  describe('name', () => {
    it('is shared by every input, so they are one group', () => {
      const { inputs } = renderGroup({ name: 'fruit' });
      expect(inputs().every((i) => i.name === 'fruit')).toBe(true);
    });

    it('is generated, and different per group, when left out', () => {
      const first = renderGroup();
      const firstName = first.inputs()[0]?.name;
      expect(firstName).toBeTruthy();
      expect(first.inputs().every((i) => i.name === firstName)).toBe(true);
      const second = renderGroup();
      expect(second.inputs()[0]?.name).not.toBe(firstName);
    });

    it('submits the selected value with the form', () => {
      const { container } = render(
        <form>
          <Radio label="Fruit" options={OPTIONS} name="fruit" defaultValue="c" />
        </form>,
      );
      const data = new FormData(container.querySelector('form') as HTMLFormElement);
      expect(data.getAll('fruit')).toEqual(['c']);
    });
  });

  describe('description', () => {
    it('is linked to its input with aria-describedby', () => {
      const { root, input } = renderGroup();
      const description = root.querySelector(`.${shared.description}`);
      expect(description?.textContent).toBe('Yellow');
      expect(input('b').getAttribute('aria-describedby')).toBe(description?.id);
      expect(input('a').hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('isDisabled', () => {
    it('on the group disables the fieldset and every input, and dims the group', () => {
      const { root, inputs } = renderGroup({ isDisabled: true });
      expect(root.disabled).toBe(true);
      expect(inputs().every((i) => i.disabled)).toBe(true);
      expect(root.classList.contains(shared.disabled as string)).toBe(true);
    });

    it('on an option disables only that input', () => {
      const options = OPTIONS.map((o) => (o.value === 'b' ? { ...o, isDisabled: true } : o));
      const { root, input } = renderGroup({ options });
      expect(input('b').disabled).toBe(true);
      expect(input('a').disabled).toBe(false);
      expect(root.classList.contains(shared.disabled as string)).toBe(false);
    });

    it('does not select a disabled option', () => {
      const options = OPTIONS.map((o) => (o.value === 'b' ? { ...o, isDisabled: true } : o));
      const onChange = vi.fn();
      const { input } = renderGroup({ options, onChange });
      // jsdom flips a disabled radio's DOM state on a synthetic click; a browser never would
      fireEvent.click(input('b'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('is off by default', () => {
      const { root, inputs } = renderGroup();
      expect(root.disabled).toBe(false);
      expect(inputs().some((i) => i.disabled)).toBe(false);
    });
  });

  describe('isRequired', () => {
    it('sets required on every input and adds a visual-only asterisk', () => {
      const { root, inputs } = renderGroup({ isRequired: true });
      expect(inputs().every((i) => i.required)).toBe(true);
      const asterisk = root.querySelector(`legend .${labelStyles.asterisk}`);
      expect(asterisk?.getAttribute('aria-hidden')).toBe('true');
    });

    it('is off by default', () => {
      const { root, inputs } = renderGroup();
      expect(inputs().some((i) => i.required)).toBe(false);
      expect(root.querySelector(`.${labelStyles.asterisk}`)).toBeNull();
    });
  });

  describe('error', () => {
    it('marks the inputs invalid and shows the message, linked by aria-describedby', () => {
      const { root, inputs } = renderGroup({ error: 'Pick one' });
      const message = root.querySelector(`.${shared.error}`);
      expect(message?.textContent).toBe('Pick one');
      expect(root.getAttribute('aria-describedby')).toBe(message?.id);
      expect(inputs().every((i) => i.getAttribute('aria-invalid') === 'true')).toBe(true);
    });

    it('gives the message an icon hidden from assistive tech', () => {
      const { root } = renderGroup({ error: 'Oops' });
      expect(root.querySelector(`.${shared.error} svg`)?.getAttribute('aria-hidden')).toBe('true');
    });

    it('keeps a consumer aria-describedby alongside the message', () => {
      const { root } = renderGroup({ error: 'Oops', 'aria-describedby': 'other' });
      const message = root.querySelector(`.${shared.error}`);
      expect(root.getAttribute('aria-describedby')).toBe(`other ${message?.id}`);
    });

    it('adds no message, no aria-invalid and no aria-describedby without an error', () => {
      const { root, inputs } = renderGroup();
      expect(root.querySelector(`.${shared.error}`)).toBeNull();
      expect(root.hasAttribute('aria-describedby')).toBe(false);
      expect(inputs().some((i) => i.hasAttribute('aria-invalid'))).toBe(false);
    });
  });
});
