import { createRef, useState, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, render, fireEvent, cleanup, screen } from '@testing-library/react';
import { Checkbox, type CheckboxOption } from './Checkbox';
import shared from '../_shared/OptionGroup.module.css';

const OPTIONS: CheckboxOption[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', description: 'Yellow' },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Date' },
];

const renderGroup = (props: Partial<ComponentProps<typeof Checkbox>> = {}) => {
  const { container } = render(<Checkbox label="Fruit" options={OPTIONS} {...props} />);
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

describe('Checkbox', () => {
  describe('element', () => {
    it('renders a fieldset with a legend and one checkbox per option', () => {
      const { root, inputs } = renderGroup();
      expect(root.tagName).toBe('FIELDSET');
      expect(root.querySelector('legend')?.textContent).toBe('Fruit');
      expect(inputs()).toHaveLength(4);
      expect(inputs().every((i) => i.type === 'checkbox')).toBe(true);
    });

    it('labels each input with its option label', () => {
      const { container } = renderGroup();
      const labels = [...container.querySelectorAll('label')].map((l) => l.textContent);
      expect(labels).toEqual(['Apple', 'BananaYellow', 'Cherry', 'Date']);
    });

    it('forwards the ref and className to the fieldset', () => {
      const ref = createRef<HTMLFieldSetElement>();
      const { container } = render(
        <Checkbox ref={ref} label="Fruit" options={OPTIONS} className="mine" />,
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
      const { root } = renderGroup({ isDisabled: true, minChecked: 1, maxChecked: 2, error: 'x' });
      for (const attr of ['isdisabled', 'minchecked', 'maxchecked', 'error', 'options'])
        expect(root.hasAttribute(attr)).toBe(false);
    });
  });

  describe('tooltip', () => {
    it('explains the group from a button beside the legend, without adding to the group name', () => {
      renderGroup({ tooltip: 'Pick any' });
      // Named by the legend's text alone, not "Fruit About Fruit"
      expect(screen.getByRole('group', { name: 'Fruit' })).toBeTruthy();
      act(() => {
        screen.getByRole('button', { name: 'About Fruit' }).focus();
      });
      expect(screen.getByRole('tooltip', { hidden: true }).textContent).toBe('Pick any');
    });

    it("leaves a caller's own aria-labelledby alone", () => {
      const { root } = renderGroup({ tooltip: 'Pick any', 'aria-labelledby': 'mine' });
      expect(root.getAttribute('aria-labelledby')).toBe('mine');
    });

    it('sets no aria-labelledby without one', () => {
      expect(renderGroup().root.hasAttribute('aria-labelledby')).toBe(false);
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
    it('works uncontrolled, starting from defaultValue', () => {
      const { input, checkedValues } = renderGroup({ defaultValue: ['b'] });
      expect(checkedValues()).toEqual(['b']);
      fireEvent.click(input('c'));
      expect(checkedValues()).toEqual(['b', 'c']);
      fireEvent.click(input('b'));
      expect(checkedValues()).toEqual(['c']);
    });

    it('works controlled', () => {
      const Controlled = () => {
        const [value, setValue] = useState(['a']);
        return <Checkbox label="Fruit" options={OPTIONS} value={value} onChange={setValue} />;
      };
      const { container } = render(<Controlled />);
      const input = (v: string) =>
        container.querySelector(`input[value="${v}"]`) as HTMLInputElement;
      fireEvent.click(input('d'));
      expect(input('a').checked && input('d').checked).toBe(true);
    });

    it('does not change by itself when controlled', () => {
      const { input } = renderGroup({ value: ['a'] });
      fireEvent.click(input('b'));
      expect(input('b').checked).toBe(false);
    });

    it('calls onChange with the values in option order, not click order', () => {
      const onChange = vi.fn();
      const { input } = renderGroup({ onChange });
      fireEvent.click(input('c'));
      fireEvent.click(input('a'));
      expect(onChange).toHaveBeenNthCalledWith(1, ['c']);
      expect(onChange).toHaveBeenNthCalledWith(2, ['a', 'c']);
    });
  });

  describe('name', () => {
    it('submits the checked values with the form', () => {
      const { container } = render(
        <form>
          <Checkbox label="Fruit" options={OPTIONS} name="fruit" defaultValue={['a', 'c']} />
        </form>,
      );
      const data = new FormData(container.querySelector('form') as HTMLFormElement);
      expect(data.getAll('fruit')).toEqual(['a', 'c']);
    });
  });

  describe('maxChecked', () => {
    it('blocks checking more once the limit is reached', () => {
      const onChange = vi.fn();
      const { input, checkedValues } = renderGroup({
        maxChecked: 2,
        defaultValue: ['a', 'b'],
        onChange,
      });
      fireEvent.click(input('c'));
      expect(checkedValues()).toEqual(['a', 'b']);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('marks the blocked options aria-disabled, but keeps them focusable', () => {
      const { input } = renderGroup({ maxChecked: 2, defaultValue: ['a', 'b'] });
      expect(input('c').getAttribute('aria-disabled')).toBe('true');
      expect(input('c').disabled).toBe(false);
      // The checked ones can still be unchecked
      expect(input('a').hasAttribute('aria-disabled')).toBe(false);
    });

    it('frees the others again after unchecking one', () => {
      const { input, checkedValues } = renderGroup({ maxChecked: 1, defaultValue: ['a'] });
      fireEvent.click(input('a'));
      expect(input('c').hasAttribute('aria-disabled')).toBe(false);
      fireEvent.click(input('c'));
      expect(checkedValues()).toEqual(['c']);
    });

    it('leaves a value that already breaks the limit alone', () => {
      const { checkedValues } = renderGroup({ maxChecked: 1, defaultValue: ['a', 'b'] });
      expect(checkedValues()).toEqual(['a', 'b']);
    });
  });

  describe('minChecked', () => {
    it('blocks unchecking once the limit is reached', () => {
      const onChange = vi.fn();
      const { input, checkedValues } = renderGroup({
        minChecked: 1,
        defaultValue: ['a'],
        onChange,
      });
      fireEvent.click(input('a'));
      expect(checkedValues()).toEqual(['a']);
      expect(onChange).not.toHaveBeenCalled();
      expect(input('a').getAttribute('aria-disabled')).toBe('true');
    });

    it('still allows checking more, and then unchecking', () => {
      const { input, checkedValues } = renderGroup({ minChecked: 1, defaultValue: ['a'] });
      fireEvent.click(input('b'));
      fireEvent.click(input('a'));
      expect(checkedValues()).toEqual(['b']);
    });

    it('blocks nothing while nothing is checked', () => {
      const { inputs } = renderGroup({ minChecked: 1 });
      expect(inputs().some((i) => i.hasAttribute('aria-disabled'))).toBe(false);
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

    it('does not toggle a disabled option', () => {
      const options = OPTIONS.map((o) => (o.value === 'b' ? { ...o, isDisabled: true } : o));
      const onChange = vi.fn();
      const { input } = renderGroup({ options, onChange });
      // jsdom flips a disabled checkbox's DOM state on a synthetic click; a browser never would
      fireEvent.click(input('b'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('counts a checked disabled option towards the limits', () => {
      const options = OPTIONS.map((o) => (o.value === 'a' ? { ...o, isDisabled: true } : o));
      const { input, checkedValues } = renderGroup({
        options,
        maxChecked: 2,
        defaultValue: ['a'],
      });
      fireEvent.click(input('b'));
      // a (locked on) + b is already the maximum
      expect(input('c').getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(input('c'));
      expect(checkedValues()).toEqual(['a', 'b']);
    });

    it('keeps a checked disabled option in the onChange value', () => {
      const onChange = vi.fn();
      const options = OPTIONS.map((o) => (o.value === 'a' ? { ...o, isDisabled: true } : o));
      const { input } = renderGroup({ options, defaultValue: ['a'], onChange });
      fireEvent.click(input('c'));
      expect(onChange).toHaveBeenCalledWith(['a', 'c']);
    });

    it('is off by default', () => {
      const { root, inputs } = renderGroup();
      expect(root.disabled).toBe(false);
      expect(inputs().some((i) => i.disabled)).toBe(false);
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
