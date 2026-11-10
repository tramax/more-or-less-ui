import { createRef, useState, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import { SegmentedControl, type SegmentOption } from './SegmentedControl';
import shared from '../_shared/OptionGroup.module.css';
import labelStyles from '../_shared/FieldLabel.module.css';
import sizes from '../_shared/Size.module.css';
import styles from './SegmentedControl.module.css';

const OPTIONS: SegmentOption[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'starred', label: 'Starred', isDisabled: true },
  { value: 'sent', label: 'Sent', icon: <svg data-testid="icon" /> },
];

const renderControl = (props: Partial<ComponentProps<typeof SegmentedControl>> = {}) => {
  const { container } = render(<SegmentedControl label="Show" options={OPTIONS} {...props} />);
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

describe('SegmentedControl', () => {
  describe('element', () => {
    it('renders a radiogroup fieldset with a legend and one radio per option', () => {
      const { root, inputs } = renderControl();
      expect(root.tagName).toBe('FIELDSET');
      expect(screen.getByRole('radiogroup', { name: 'Show' })).toBe(root);
      expect(root.querySelector('legend')?.textContent).toBe('Show');
      expect(inputs()).toHaveLength(4);
      expect(inputs().every((i) => i.type === 'radio')).toBe(true);
    });

    it('names each radio by its label', () => {
      renderControl();
      expect(screen.getByRole('radio', { name: 'Unread' })).toBeTruthy();
      expect(screen.getByRole('radio', { name: 'Sent' })).toBeTruthy();
    });

    it('forwards the ref, className, style and other props to the fieldset', () => {
      const ref = createRef<HTMLFieldSetElement>();
      const { root } = renderControl({ ref, className: 'mine', style: { margin: 4 }, id: 'seg' });
      expect(ref.current).toBe(root);
      expect(root.classList.contains('mine')).toBe(true);
      expect(root.style.margin).toBe('4px');
      expect(root.id).toBe('seg');
    });

    it('can be named by aria-label instead of a legend', () => {
      const { root } = renderControl({ label: undefined, 'aria-label': 'Filter' });
      expect(root.querySelector('legend')).toBeNull();
      expect(screen.getByRole('radiogroup', { name: 'Filter' })).toBe(root);
    });

    it('shows an option icon as decorative, before the label', () => {
      renderControl();
      const icon = screen.getByTestId('icon');
      expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.getByRole('radio', { name: 'Sent' })).toBeTruthy();
    });

    it('shows a required asterisk and puts required on every input', () => {
      const { root, inputs } = renderControl({ isRequired: true });
      expect(root.querySelector(`.${labelStyles.asterisk}`)).not.toBeNull();
      expect(inputs().every((i) => i.required)).toBe(true);
    });
  });

  describe('selection', () => {
    it('selects nothing by default', () => {
      const { checkedValues } = renderControl();
      expect(checkedValues()).toEqual([]);
    });

    it('starts on defaultValue and keeps its own state when uncontrolled', () => {
      const onChange = vi.fn();
      const { input, checkedValues } = renderControl({ defaultValue: 'all', onChange });
      expect(checkedValues()).toEqual(['all']);
      fireEvent.click(input('unread'));
      expect(checkedValues()).toEqual(['unread']);
      expect(onChange).toHaveBeenCalledWith('unread');
    });

    it('does not call onChange for the segment that is already selected', () => {
      const onChange = vi.fn();
      const { input } = renderControl({ defaultValue: 'all', onChange });
      fireEvent.click(input('all'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('follows value when controlled, whatever is clicked', () => {
      const onChange = vi.fn();
      const { input, checkedValues } = renderControl({ value: 'all', onChange });
      fireEvent.click(input('unread'));
      expect(onChange).toHaveBeenCalledWith('unread');
      expect(checkedValues()).toEqual(['all']);
    });

    it('is controlled with nothing selected for null', () => {
      const { input, checkedValues } = renderControl({ value: null, defaultValue: 'all' });
      expect(checkedValues()).toEqual([]);
      fireEvent.click(input('unread'));
      expect(checkedValues()).toEqual([]);
    });

    it('follows a parent that updates value', () => {
      const Parent = () => {
        const [value, setValue] = useState<string | null>('all');
        return (
          <SegmentedControl label="Show" options={OPTIONS} value={value} onChange={setValue} />
        );
      };
      render(<Parent />);
      fireEvent.click(screen.getByRole('radio', { name: 'Unread' }));
      expect((screen.getByRole('radio', { name: 'Unread' }) as HTMLInputElement).checked).toBe(
        true,
      );
      expect((screen.getByRole('radio', { name: 'All' }) as HTMLInputElement).checked).toBe(false);
    });

    it('never selects a disabled segment', () => {
      const onChange = vi.fn();
      const { input } = renderControl({ onChange });
      expect(input('starred').disabled).toBe(true);
      fireEvent.click(input('starred'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('form', () => {
    it('gives the inputs one shared name, generated when left out', () => {
      const { inputs } = renderControl();
      const names = new Set(inputs().map((i) => i.name));
      expect(names.size).toBe(1);
      expect([...names][0]).not.toBe('');
    });

    it('uses the name it is given, and submits the selected value', () => {
      const { container } = render(
        <form>
          <SegmentedControl label="Show" options={OPTIONS} name="filter" defaultValue="unread" />
        </form>,
      );
      const data = new FormData(container.querySelector('form') as HTMLFormElement);
      expect(data.get('filter')).toBe('unread');
    });
  });

  describe('disabled', () => {
    it('disables the fieldset and every input, and dims the group', () => {
      const { root, inputs } = renderControl({ isDisabled: true });
      expect(root.disabled).toBe(true);
      expect(inputs().every((i) => i.disabled)).toBe(true);
      expect(root.classList.contains(shared.disabled!)).toBe(true);
    });
  });

  describe('error', () => {
    it('shows the message, links it to the group, and marks every input invalid', () => {
      const { root, inputs } = renderControl({ error: 'Pick one' });
      const message = screen.getByText('Pick one');
      expect(message.closest('p')?.id).toBeTruthy();
      expect(root.getAttribute('aria-describedby')).toBe(message.closest('p')?.id);
      expect(inputs().every((i) => i.getAttribute('aria-invalid') === 'true')).toBe(true);
    });

    it('puts the error fill on the track', () => {
      const { container } = renderControl({ error: 'Pick one' });
      expect(container.querySelector(`.${styles.track}`)?.classList.contains(styles.invalid!)).toBe(
        true,
      );
    });

    it('has neither without an error', () => {
      const { root, inputs, container } = renderControl();
      expect(root.getAttribute('aria-describedby')).toBeNull();
      expect(inputs().every((i) => !i.hasAttribute('aria-invalid'))).toBe(true);
      expect(container.querySelector(`.${styles.invalid}`)).toBeNull();
    });
  });

  describe('size', () => {
    it('defaults to normal', () => {
      const { root } = renderControl();
      expect(root.classList.contains(sizes.sizeNormal!)).toBe(true);
    });

    it('takes less and more as classes and anything else as a font-size', () => {
      expect(renderControl({ size: 'less' }).root.classList.contains(sizes.sizeLess!)).toBe(true);
      cleanup();
      expect(renderControl({ size: '1em' }).root.style.fontSize).toBe('1em');
    });
  });

  describe('thumb', () => {
    // jsdom has no layout, so give each segment a box: Unread is the second, 80 wide
    const boxes: Record<string, { left: number; top: number; width: number; height: number }> = {
      All: { left: 4, top: 4, width: 60, height: 36 },
      Unread: { left: 68, top: 4, width: 80, height: 36 },
    };
    const stub = (key: 'left' | 'top' | 'width' | 'height', prop: string) =>
      vi.spyOn(HTMLElement.prototype, prop as 'offsetLeft', 'get').mockImplementation(function (
        this: HTMLElement,
      ) {
        return boxes[this.textContent ?? '']?.[key] ?? 0;
      });
    const stubAll = () => {
      stub('left', 'offsetLeft');
      stub('top', 'offsetTop');
      stub('width', 'offsetWidth');
      stub('height', 'offsetHeight');
    };
    const thumb = (container: HTMLElement) =>
      container.querySelector(`.${styles.track} > [aria-hidden="true"]`) as HTMLElement | null;

    afterEach(() => vi.restoreAllMocks());

    it('is a decorative element in the track, placed on the selected segment', () => {
      stubAll();
      const { container } = renderControl({ defaultValue: 'all' });
      expect(thumb(container)?.getAttribute('role')).toBeNull();
      expect(thumb(container)?.style.width).toBe('60px');
      expect(thumb(container)?.style.height).toBe('36px');
      expect(thumb(container)?.style.transform).toBe('translate(4px, 4px)');
    });

    it('moves to the segment that is chosen', () => {
      stubAll();
      const { container, input } = renderControl({ defaultValue: 'all' });
      fireEvent.click(input('unread'));
      expect(thumb(container)?.style.transform).toBe('translate(68px, 4px)');
      expect(thumb(container)?.style.width).toBe('80px');
    });

    it('is absent while nothing is selected', () => {
      const { container } = renderControl();
      expect(thumb(container)).toBeNull();
    });

    it('is absent when the value names no segment', () => {
      const { container } = renderControl({ value: 'missing' });
      expect(thumb(container)).toBeNull();
    });
  });
});
