import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { LocalDate } from '../_shared/dateValue';
import { DateField, type DateFieldProps } from './DateField';

beforeEach(() => {
  // Wednesday 11 November 2026, midday
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// en-GB: day, month, year, which is the order the tests type in
const renderField = (props: Partial<DateFieldProps> = {}) => {
  const onChange = vi.fn();
  const view = render(<DateField label="Birthday" locale="en-GB" onChange={onChange} {...props} />);
  return { onChange, ...view };
};

const segment = (name: string) => screen.getByRole('spinbutton', { name }) as HTMLInputElement;
const day = () => segment('Day');
const month = () => segment('Month');
const year = () => segment('Year');
const focus = (element: HTMLElement) => act(() => element.focus());
const press = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(target, { key: name, ...init });
const type = (digits: string) => {
  for (const digit of digits) press(document.activeElement as Element, digit);
};
const texts = () => [day().value, month().value, year().value];

// A field that keeps its own value, as a form does
function Stateful({
  onChange,
  defaultValue = null,
  ...props
}: Partial<DateFieldProps> & { defaultValue?: LocalDate | null }) {
  const [value, setValue] = useState<LocalDate | null>(defaultValue);
  return (
    <DateField
      label="Birthday"
      locale="en-GB"
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe('DateField', () => {
  describe('structure', () => {
    it('is a group named by its label, with a named spinbutton for each part', () => {
      renderField();
      const group = screen.getByRole('group', { name: 'Birthday' });
      expect(group.querySelectorAll('input[role="spinbutton"]')).toHaveLength(3);
      expect(day().getAttribute('aria-valuemin')).toBe('1');
      expect(day().getAttribute('aria-valuemax')).toBe('31');
      expect(month().getAttribute('aria-valuemax')).toBe('12');
      expect(year().getAttribute('aria-valuemax')).toBe('9999');
    });

    it('can be named by aria-label instead', () => {
      render(<DateField aria-label="Date of birth" />);
      expect(screen.getByRole('group', { name: 'Date of birth' })).toBeTruthy();
    });

    it('puts the parts in the order of the locale, with its separators', () => {
      const { container, rerender } = renderField({ locale: 'en-US' });
      const order = () =>
        Array.from(container.querySelectorAll('input[role="spinbutton"]')).map((input) =>
          input.getAttribute('aria-label'),
        );
      expect(order()).toEqual(['Month', 'Day', 'Year']);
      expect(container.textContent).toContain('/');
      rerender(<DateField label="Birthday" locale="ja-JP" />);
      expect(order()).toEqual(['Year', 'Month', 'Day']);
      rerender(<DateField label="Birthday" locale="de-DE" />);
      expect(order()).toEqual(['Day', 'Month', 'Year']);
      expect(container.textContent).toContain('.');
    });

    it('hides the separators from assistive tech', () => {
      const { container } = renderField();
      expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(2);
    });

    it('shows placeholders and says "empty" for an empty segment', () => {
      renderField();
      expect(day().placeholder).toBe('dd');
      expect(month().placeholder).toBe('mm');
      expect(year().placeholder).toBe('yyyy');
      expect(day().getAttribute('aria-valuetext')).toBe('empty');
      expect(day().hasAttribute('aria-valuenow')).toBe(false);
    });

    it('takes the names and placeholders in another language', () => {
      renderField({
        labels: { day: 'Tag', month: 'Monat', year: 'Jahr', empty: 'leer' },
        placeholders: { day: 'tt', month: 'mm', year: 'jjjj' },
      });
      expect(segment('Tag').placeholder).toBe('tt');
      expect(segment('Jahr').getAttribute('aria-valuetext')).toBe('leer');
    });

    it('forwards the ref to the first segment, which the label points at', () => {
      const ref = createRef<HTMLInputElement>();
      render(<DateField label="Birthday" locale="en-GB" ref={ref} />);
      expect(ref.current).toBe(day());
      expect((screen.getByText('Birthday') as HTMLLabelElement).htmlFor).toBe(day().id);
    });

    it('marks it required with an asterisk and aria-required', () => {
      renderField({ isRequired: true });
      expect(day().getAttribute('aria-required')).toBe('true');
      expect(screen.getByText('*', { exact: false })).toBeTruthy();
    });
  });

  describe('values', () => {
    it('shows a value as finished segments', () => {
      renderField({ value: '1988-03-04' });
      expect(texts()).toEqual(['04', '03', '1988']);
      expect(day().getAttribute('aria-valuenow')).toBe('4');
    });

    it('shows a defaultValue, and keeps what is typed when uncontrolled', () => {
      const { onChange } = renderField({ defaultValue: '1988-03-04' });
      expect(texts()).toEqual(['04', '03', '1988']);
      focus(day());
      type('15');
      expect(onChange).toHaveBeenLastCalledWith('1988-03-15');
      expect(texts()).toEqual(['15', '03', '1988']);
    });

    it('follows a controlled value that changes', () => {
      const { rerender } = renderField({ value: '1988-03-04' });
      rerender(<DateField label="Birthday" locale="en-GB" value="2001-12-25" />);
      expect(texts()).toEqual(['25', '12', '2001']);
      rerender(<DateField label="Birthday" locale="en-GB" value={null} />);
      expect(texts()).toEqual(['', '', '']);
    });

    it('goes back to the value when a controlled parent does not take the change', () => {
      renderField({ value: '1988-03-04' });
      focus(day());
      type('15');
      expect(texts()).toEqual(['04', '03', '1988']);
    });

    it('shows none for a value that is not a local date, and logs an error naming the fix', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderField({ value: '1988-03-04T00:00:00Z' as LocalDate });
      expect(texts()).toEqual(['', '', '']);
      expect(error).toHaveBeenCalled();
      expect(String(error.mock.calls[0]?.[0])).toContain('fromInstant');
    });

    it('submits the date under its name, or nothing when there is none', () => {
      const { container, rerender } = renderField({ name: 'birthday', value: '1988-03-04' });
      const hidden = () => container.querySelector<HTMLInputElement>('input[type="hidden"]')!;
      expect(hidden().name).toBe('birthday');
      expect(hidden().value).toBe('1988-03-04');
      rerender(<DateField label="Birthday" locale="en-GB" name="birthday" value={null} />);
      expect(hidden().value).toBe('');
    });

    it('has no hidden input without a name', () => {
      const { container } = renderField();
      expect(container.querySelector('input[type="hidden"]')).toBeNull();
    });
  });

  describe('typing', () => {
    it('types a date with no key but the digits, moving on by itself', () => {
      const onChange = vi.fn();
      render(<Stateful onChange={onChange} />);
      focus(day());
      type('14031988');
      expect(texts()).toEqual(['14', '03', '1988']);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith('1988-03-14');
      expect(document.activeElement).toBe(year());
    });

    it('finishes a day that no second digit could follow, and moves on', () => {
      render(<Stateful />);
      focus(day());
      type('4');
      expect(day().value).toBe('04');
      expect(document.activeElement).toBe(month());
    });

    it('waits on a digit that could be followed, and finishes it when focus leaves', () => {
      render(<Stateful />);
      focus(day());
      type('3');
      expect(day().value).toBe('3');
      expect(document.activeElement).toBe(day());
      focus(month());
      expect(day().value).toBe('03');
    });

    it('reports a date as soon as there is one, and null when it stops being one', () => {
      const onChange = vi.fn();
      render(<Stateful onChange={onChange} />);
      focus(day());
      type('14031988');
      expect(onChange).toHaveBeenLastCalledWith('1988-03-14');
      focus(day());
      press(day(), 'Backspace');
      expect(onChange).toHaveBeenLastCalledWith(null);
      expect(texts()).toEqual(['', '03', '1988']);
    });

    it('does not report anything while it is unfinished', () => {
      const onChange = vi.fn();
      render(<Stateful onChange={onChange} />);
      focus(day());
      type('140319');
      expect(onChange).not.toHaveBeenCalled();
      expect(year().value).toBe('19');
    });

    it('starts a segment over when it is entered again', () => {
      render(<Stateful />);
      focus(day());
      type('14');
      focus(day());
      // Not "142": the 2 is a new first digit, which could still be followed
      type('2');
      expect(day().value).toBe('2');
    });

    it('treats a separator as the end of a segment', () => {
      render(<Stateful />);
      focus(day());
      type('3');
      press(day(), '/');
      expect(day().value).toBe('03');
      expect(document.activeElement).toBe(month());
    });

    it('ignores letters, and a separator in an empty segment', () => {
      render(<Stateful />);
      focus(day());
      press(day(), 'a');
      press(day(), '/');
      expect(texts()).toEqual(['', '', '']);
      expect(document.activeElement).toBe(day());
    });

    it('does not take a key with Ctrl or Meta', () => {
      render(<Stateful />);
      focus(day());
      press(day(), '4', { ctrlKey: true });
      press(day(), '4', { metaKey: true });
      expect(day().value).toBe('');
    });

    it('takes what a phone keyboard sends as input, with no keys', () => {
      render(<Stateful />);
      focus(day());
      fireEvent.change(day(), { target: { value: '4' } });
      expect(day().value).toBe('04');
      expect(document.activeElement).toBe(month());
    });

    it('treats an impossible date as none, and marks every segment invalid', () => {
      const onChange = vi.fn();
      render(<Stateful onChange={onChange} />);
      focus(day());
      type('30022024');
      expect(onChange).not.toHaveBeenCalled();
      expect(day().getAttribute('aria-invalid')).toBe('true');
      expect(month().getAttribute('aria-invalid')).toBe('true');
      expect(year().getAttribute('aria-invalid')).toBe('true');
    });

    it('does not mark an unfinished date invalid', () => {
      render(<Stateful />);
      focus(day());
      type('3002');
      expect(day().hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('keys', () => {
    it('steps a segment with the arrows, wrapping the day and the month', () => {
      render(<Stateful defaultValue="2026-12-31" />);
      focus(day());
      press(day(), 'ArrowUp');
      expect(day().value).toBe('01');
      press(day(), 'ArrowDown');
      expect(day().value).toBe('31');
      focus(month());
      press(month(), 'ArrowUp');
      expect(month().value).toBe('01');
    });

    it('takes today for an empty segment', () => {
      render(<Stateful />);
      focus(day());
      press(day(), 'ArrowUp');
      expect(day().value).toBe('11');
      focus(year());
      press(year(), 'ArrowDown');
      expect(year().value).toBe('2026');
    });

    it('moves between segments with Left and Right, and not past the ends', () => {
      render(<Stateful />);
      focus(day());
      press(day(), 'ArrowRight');
      expect(document.activeElement).toBe(month());
      press(month(), 'ArrowRight');
      expect(document.activeElement).toBe(year());
      press(year(), 'ArrowRight');
      expect(document.activeElement).toBe(year());
      press(year(), 'ArrowLeft');
      expect(document.activeElement).toBe(month());
    });

    it('moves the other way in a right-to-left layout', () => {
      render(<Stateful />);
      // Found before the mock: Testing Library reads computed styles too
      const first = day();
      const second = month();
      focus(first);
      // jsdom has no layout, so it does not hand `direction` down to the segments
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        direction: 'rtl',
      } as CSSStyleDeclaration);
      press(first, 'ArrowLeft');
      expect(document.activeElement).toBe(second);
    });

    it('clears a segment with Backspace or Delete, and Backspace in an empty one goes back', () => {
      render(<Stateful defaultValue="1988-03-04" />);
      focus(month());
      press(month(), 'Delete');
      expect(month().value).toBe('');
      press(month(), 'Backspace');
      expect(document.activeElement).toBe(day());
    });

    it('leaves Alt+Down alone, for a picker to open on', () => {
      const onKeyDown = vi.fn();
      render(
        <DateField
          label="Birthday"
          locale="en-GB"
          onKeyDown={onKeyDown}
          defaultValue="1988-03-04"
        />,
      );
      focus(day());
      press(day(), 'ArrowDown', { altKey: true });
      expect(day().value).toBe('04');
      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe('paste', () => {
    it('fills all three from a pasted date', () => {
      const onChange = vi.fn();
      renderField({ onChange });
      focus(day());
      fireEvent.paste(day(), { clipboardData: { getData: () => '1988-03-14' } });
      expect(onChange).toHaveBeenLastCalledWith('1988-03-14');
    });

    it('ignores text that is not a date', () => {
      const onChange = vi.fn();
      renderField({ onChange });
      focus(day());
      fireEvent.paste(day(), { clipboardData: { getData: () => 'soon' } });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('focus', () => {
    it('enters the first segment when the padding of the field is pressed', () => {
      renderField();
      fireEvent.click(screen.getByRole('group'));
      expect(document.activeElement).toBe(day());
    });

    it('calls onFocus and onBlur for the field, not for each move between segments', () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(
        <>
          <DateField label="Birthday" locale="en-GB" onFocus={onFocus} onBlur={onBlur} />
          <button>after</button>
        </>,
      );
      focus(day());
      focus(month());
      focus(year());
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).not.toHaveBeenCalled();
      focus(screen.getByRole('button'));
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('error, disabled and read-only', () => {
    it('shows the error and ties it to every segment', () => {
      renderField({ error: 'Enter your birthday' });
      expect(screen.getByText('Enter your birthday')).toBeTruthy();
      for (const input of [day(), month(), year()]) {
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')).toBeTruthy();
      }
    });

    it('disables every segment', () => {
      renderField({ isDisabled: true });
      for (const input of [day(), month(), year()]) expect(input.disabled).toBe(true);
    });

    it('is read-only: shown, submitted, out of the tab order, and not typed in', () => {
      const { onChange, container } = renderField({
        isReadOnly: true,
        name: 'birthday',
        defaultValue: '1988-03-04',
      });
      for (const input of [day(), month(), year()]) {
        expect(input.readOnly).toBe(true);
        expect(input.tabIndex).toBe(-1);
      }
      press(day(), '5');
      press(day(), 'ArrowUp');
      expect(day().value).toBe('04');
      expect(onChange).not.toHaveBeenCalled();
      expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe(
        '1988-03-04',
      );
    });
  });

  describe('root', () => {
    it('puts className and style on the root, and the id on the first segment', () => {
      const { container } = renderField({ className: 'mine', style: { marginTop: 3 }, id: 'bday' });
      const root = container.firstElementChild as HTMLElement;
      expect(root.classList.contains('mine')).toBe(true);
      expect(root.style.marginTop).toBe('3px');
      expect(day().id).toBe('bday');
    });
  });
});
