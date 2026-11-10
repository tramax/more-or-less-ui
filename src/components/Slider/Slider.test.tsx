import { createRef, useState, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import { Slider } from './Slider';
import styles from './Slider.module.css';
import frameStyles from '../_shared/TextFieldFrame.module.css';
import errorStyles from '../_shared/FieldError.module.css';

// The label, error, id and size wiring is TextFieldFrame's, and TextField's tests cover it in full.
// These check that Slider is hooked up to it, and test what is its own: the range input, its value
// (kept here or by the parent) and the --slider-value the CSS draws the fill from.

const renderSlider = (props: Partial<ComponentProps<typeof Slider>> = {}) => {
  const { container } = render(<Slider label="Volume" {...props} />);
  return {
    root: container.firstElementChild as HTMLDivElement,
    input: screen.getByRole('slider') as HTMLInputElement,
  };
};

const change = (input: HTMLInputElement, value: number) =>
  fireEvent.change(input, { target: { value: String(value) } });

const fillOf = (input: HTMLInputElement) => input.style.getPropertyValue('--slider-value');

afterEach(cleanup);

describe('Slider', () => {
  describe('element', () => {
    it('renders a native range input with the slider role, named by its label', () => {
      const { input } = renderSlider();
      expect(input.type).toBe('range');
      expect(screen.getByRole('slider', { name: 'Volume' })).toBe(input);
    });

    it('is named by aria-label when there is no label', () => {
      const { container } = render(<Slider aria-label="Volume" />);
      expect(container.querySelector('label')).toBeNull();
      expect(screen.getByRole('slider', { name: 'Volume' })).toBeTruthy();
    });

    it('forwards the ref and the rest to the input, className and style to the root', () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(
        <Slider
          ref={ref}
          label="Volume"
          id="mine"
          name="volume"
          data-testid="s"
          className="mine"
          style={{ margin: 1 }}
        />,
      );
      const root = container.firstElementChild as HTMLElement;
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(ref.current).toBe(input);
      expect(input.id).toBe('mine');
      expect(input.name).toBe('volume');
      expect(input.dataset.testid).toBe('s');
      expect(root.classList.contains('mine')).toBe(true);
      expect(root.style.margin).toBe('1px');
      expect(input.classList.contains('mine')).toBe(false);
    });

    it('adds the frame and the slider classes to the root, and its own class to the input', () => {
      const { root, input } = renderSlider();
      expect([...root.classList]).toEqual([frameStyles.root, frameStyles.sizeNormal, styles.root]);
      expect([...input.classList]).toEqual([styles.input]);
    });

    it('does not take the text field box class, and does not leak props to the DOM', () => {
      const { input } = renderSlider({
        size: 'more',
        isDisabled: true,
        error: 'x',
        formatValue: String,
      });
      expect(input.classList.contains(frameStyles.control as string)).toBe(false);
      for (const attr of ['size', 'isdisabled', 'error', 'formatvalue', 'readonly', 'required'])
        expect(input.hasAttribute(attr)).toBe(false);
    });
  });

  describe('range', () => {
    it('runs 0 to 100 in steps of 1 by default', () => {
      const { input } = renderSlider();
      expect([input.min, input.max, input.step]).toEqual(['0', '100', '1']);
    });

    it('takes min, max and step', () => {
      const { input } = renderSlider({ min: 10, max: 50, step: 5 });
      expect([input.min, input.max, input.step]).toEqual(['10', '50', '5']);
    });

    it('falls back to a step of 1 for zero or a negative number', () => {
      expect(renderSlider({ step: 0 }).input.step).toBe('1');
      cleanup();
      expect(renderSlider({ step: -2 }).input.step).toBe('1');
    });
  });

  describe('value', () => {
    it('starts in the middle of the track', () => {
      expect(renderSlider().input.value).toBe('50');
      cleanup();
      expect(renderSlider({ min: 0, max: 10, step: 2 }).input.value).toBe('6'); // 5 is between two steps; the spec rounds a tie up
    });

    it('starts at defaultValue', () => {
      expect(renderSlider({ defaultValue: 20 }).input.value).toBe('20');
    });

    it('holds a value outside the range to it, and puts it on a step', () => {
      expect(renderSlider({ defaultValue: 400 }).input.value).toBe('100');
      cleanup();
      expect(renderSlider({ value: -5, onChange: () => {} }).input.value).toBe('0');
      cleanup();
      expect(renderSlider({ defaultValue: 33, step: 10 }).input.value).toBe('30');
      cleanup();
      // Steps of 20 from 0 are 0, 20, ... 80, 100: 100 is past max, so 95 holds to 80
      expect(renderSlider({ defaultValue: 95, max: 95, step: 20 }).input.value).toBe('80');
    });

    it('keeps steps free of float noise', () => {
      expect(renderSlider({ defaultValue: 0.3, max: 1, step: 0.1 }).input.value).toBe('0.3');
    });

    it('moves with the user when uncontrolled', () => {
      const { input } = renderSlider({ defaultValue: 20 });
      change(input, 60);
      expect(input.value).toBe('60');
    });

    it('calls onChange with the number', () => {
      const onChange = vi.fn();
      const { input } = renderSlider({ onChange });
      change(input, 70);
      change(input, 71);
      expect(onChange.mock.calls).toEqual([[70], [71]]);
    });

    it('shows `value` and changes only when the parent does (controlled)', () => {
      const onChange = vi.fn();
      const { input } = renderSlider({ value: 30, onChange });
      change(input, 60);
      expect(onChange).toHaveBeenCalledWith(60);
      expect(input.value).toBe('30');
    });

    it('follows a parent that updates `value`', () => {
      const Parent = () => {
        const [value, setValue] = useState(10);
        return <Slider label="Volume" value={value} onChange={setValue} />;
      };
      render(<Parent />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      change(input, 80);
      expect(input.value).toBe('80');
    });

    it('is submitted with its name', () => {
      const { container } = render(
        <form>
          <Slider label="Volume" name="volume" defaultValue={35} />
        </form>,
      );
      expect([...new FormData(container.firstElementChild as HTMLFormElement)]).toEqual([
        ['volume', '35'],
      ]);
    });
  });

  describe('fill', () => {
    // The CSS draws the track from this number, so it has to follow the value
    it('is the share of the track up to the value, 0 to 100', () => {
      const { input } = renderSlider({ min: 10, max: 30, defaultValue: 15 });
      expect(Number(fillOf(input))).toBe(25);
      change(input, 30);
      expect(Number(fillOf(input))).toBe(100);
      change(input, 10);
      expect(Number(fillOf(input))).toBe(0);
    });

    it('follows a controlled value', () => {
      const { input } = renderSlider({ value: 80, onChange: () => {} });
      expect(Number(fillOf(input))).toBe(80);
    });

    it('is empty when max is not above min', () => {
      expect(Number(fillOf(renderSlider({ min: 5, max: 5 }).input))).toBe(0);
    });
  });

  describe('formatValue', () => {
    it('puts the value in words in aria-valuetext, and follows it', () => {
      const { input } = renderSlider({ defaultValue: 30, formatValue: (v) => `${v}%` });
      expect(input.getAttribute('aria-valuetext')).toBe('30%');
      change(input, 45);
      expect(input.getAttribute('aria-valuetext')).toBe('45%');
    });

    it('leaves aria-valuetext to the consumer without it', () => {
      expect(renderSlider().input.hasAttribute('aria-valuetext')).toBe(false);
      cleanup();
      expect(
        renderSlider({ 'aria-valuetext': 'Medium' }).input.getAttribute('aria-valuetext'),
      ).toBe('Medium');
    });
  });

  describe('label', () => {
    it('is linked to the input', () => {
      const { container } = render(<Slider label="Volume" id="mine" />);
      expect(container.querySelector('label')?.htmlFor).toBe('mine');
    });
  });

  describe('size', () => {
    it.each(['less', 'normal', 'more'] as const)('size="%s" applies the frame class', (size) => {
      const className = frameStyles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`];
      expect(renderSlider({ size }).root.classList.contains(className as string)).toBe(true);
      cleanup();
    });

    it('writes an escape-hatch size to font-size on the root', () => {
      expect(renderSlider({ size: '1.5rem' }).root.style.fontSize).toBe('1.5rem');
    });
  });

  describe('state', () => {
    it('isDisabled sets the native attribute and dims the slider', () => {
      const { root, input } = renderSlider({ isDisabled: true });
      expect(input.disabled).toBe(true);
      expect(root.classList.contains(frameStyles.disabled as string)).toBe(true);
    });

    it('is enabled by default', () => {
      const { root, input } = renderSlider();
      expect(input.disabled).toBe(false);
      expect(root.classList.contains(frameStyles.disabled as string)).toBe(false);
    });

    it('has no asterisk, however it is named', () => {
      const { container } = render(<Slider label="Volume" />);
      expect(container.textContent).toBe('Volume');
    });
  });

  describe('error', () => {
    it('marks the input invalid and shows the message, linked by aria-describedby', () => {
      const { root, input } = renderSlider({ error: 'Too loud', 'aria-describedby': 'other' });
      const message = root.querySelector(`.${errorStyles.error}`);
      expect(message?.textContent).toBe('Too loud');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe(`other ${message?.id}`);
    });

    it('adds no message and no aria-invalid without an error', () => {
      const { root, input } = renderSlider();
      expect(root.querySelector(`.${errorStyles.error}`)).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(input.hasAttribute('aria-describedby')).toBe(false);
    });
  });
});
