import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { LocalDate } from '../_shared/dateValue';
import { DatePicker, type DatePickerProps } from './DatePicker';

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

const renderPicker = (props: Partial<DatePickerProps> = {}) => {
  const onChange = vi.fn();
  const onOpenChange = vi.fn();
  const view = render(
    <>
      <DatePicker
        label="Due date"
        locale="en-GB"
        firstDayOfWeek={1}
        onChange={onChange}
        onOpenChange={onOpenChange}
        {...props}
      />
      <button type="button">Elsewhere</button>
    </>,
  );
  return { onChange, onOpenChange, ...view };
};

const segment = (name: string) => screen.getByRole('spinbutton', { name }) as HTMLInputElement;
const day = () => segment('Day');
const month = () => segment('Month');
const year = () => segment('Year');
const trigger = () => screen.getByRole('button', { name: 'Choose date' });
const popup = () => screen.queryByRole('dialog', { hidden: true });
const cell = (date: string) => document.querySelector<HTMLButtonElement>(`[data-key="${date}"]`)!;
const focus = (element: HTMLElement) => act(() => element.focus());
const press = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(target, { key: name, ...init });
const open = () => fireEvent.click(trigger());

describe('DatePicker', () => {
  describe('the field', () => {
    it('is a DateField: three segments named by the label, with the date in them', () => {
      renderPicker({ value: '2026-11-20' });
      expect(screen.getByRole('group', { name: 'Due date' })).toBeTruthy();
      expect([day().value, month().value, year().value]).toEqual(['20', '11', '2026']);
    });

    it('has a calendar button, closed at first, that names its popup', () => {
      renderPicker();
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
      expect(popup()).toBeNull();
    });

    it('takes a typed date as the value', () => {
      const { onChange } = renderPicker();
      focus(day());
      for (const digit of '20112026') press(document.activeElement as Element, digit);
      expect(onChange).toHaveBeenLastCalledWith('2026-11-20');
    });

    it('forwards the ref to the first segment', () => {
      const ref = createRef<HTMLInputElement>();
      render(<DatePicker label="Due date" locale="en-GB" ref={ref} />);
      expect(ref.current).toBe(day());
    });

    it('submits the value under its name', () => {
      const { container } = renderPicker({ name: 'due', value: '2026-11-20' });
      expect(container.querySelector<HTMLInputElement>('input[name="due"]')?.value).toBe(
        '2026-11-20',
      );
    });
  });

  describe('opening and closing', () => {
    it('opens a calendar from the button, on the month of the value', () => {
      const { onOpenChange } = renderPicker({ defaultValue: '2026-12-25' });
      open();
      expect(popup()?.dataset.state).toBe('open');
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByText('December 2026')).toBeTruthy();
      expect(cell('2026-12-25').closest('[aria-selected="true"]')).toBeTruthy();
    });

    it('opens on today with no value', () => {
      renderPicker();
      open();
      expect(screen.getByText('November 2026')).toBeTruthy();
    });

    it('moves focus to the day the keyboard would start on, when opened by the button', () => {
      renderPicker({ defaultValue: '2026-11-20' });
      open();
      expect(document.activeElement).toBe(cell('2026-11-20'));
    });

    it('opens with Alt+Down in the field, and takes focus', () => {
      const { onOpenChange } = renderPicker({ defaultValue: '2026-11-20' });
      focus(day());
      press(day(), 'ArrowDown', { altKey: true });
      expect(popup()?.dataset.state).toBe('open');
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(document.activeElement).toBe(cell('2026-11-20'));
      // And it did not step the day
      expect(day().value).toBe('20');
    });

    it('closes with the button again, with Escape, and with a press outside', () => {
      renderPicker();
      open();
      fireEvent.click(trigger());
      expect(popup()?.dataset.state).toBe('closed');
      open();
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(popup()?.dataset.state).toBe('closed');
      open();
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Elsewhere' }));
      expect(popup()?.dataset.state).toBe('closed');
    });

    it('goes back a view with the first Escape and closes with the second', () => {
      renderPicker({ defaultValue: '2026-11-20' });
      open();
      // The name in the calendar's header, which opens the months
      fireEvent.click(document.querySelector<HTMLElement>('[aria-live] > button')!);
      expect(screen.queryByRole('grid')).toBeNull();
      press(document.activeElement as Element, 'Escape');
      expect(screen.getByRole('grid')).toBeTruthy();
      expect(popup()?.dataset.state).toBe('open');
      fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
      expect(popup()?.dataset.state).toBe('closed');
    });

    it('returns focus to the button when it closes with focus inside', () => {
      renderPicker();
      open();
      fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
      expect(document.activeElement).toBe(trigger());
    });

    it('can start open without taking focus, and be controlled', () => {
      const { rerender } = render(<DatePicker label="Due date" locale="en-GB" defaultIsOpen />);
      expect(popup()?.dataset.state).toBe('open');
      expect(document.activeElement).not.toBe(document.querySelector('[data-cell]'));
      rerender(<DatePicker label="Due date" locale="en-GB" isOpen={false} />);
      expect(popup()?.dataset.state).toBe('closed');
    });

    it('asks a controlled parent to change instead of changing itself', () => {
      const onOpenChange = vi.fn();
      render(
        <DatePicker label="Due date" locale="en-GB" isOpen={false} onOpenChange={onOpenChange} />,
      );
      open();
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(popup()).toBeNull();
    });
  });

  describe('choosing in the calendar', () => {
    it('sets the value, fills the field and closes', () => {
      const { onChange, onOpenChange } = renderPicker();
      open();
      fireEvent.click(cell('2026-11-20'));
      expect(onChange).toHaveBeenCalledWith('2026-11-20');
      expect([day().value, month().value, year().value]).toEqual(['20', '11', '2026']);
      expect(popup()?.dataset.state).toBe('closed');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('choosing a date of another month turns the page first', () => {
      const { onChange } = renderPicker();
      open();
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      fireEvent.click(cell('2026-12-05'));
      expect(onChange).toHaveBeenCalledWith('2026-12-05');
    });

    it('follows the field when a date is typed while it is open', () => {
      renderPicker({ defaultValue: '2026-11-20' });
      open();
      focus(month());
      for (const digit of '03') press(document.activeElement as Element, digit);
      expect(screen.getByText('March 2026')).toBeTruthy();
    });

    it('does not choose on a press outside the days', () => {
      const { onChange } = renderPicker();
      open();
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('limits', () => {
    it('dims dates outside min and max in the calendar', () => {
      renderPicker({ min: '2026-11-10', max: '2026-11-20' });
      open();
      expect(cell('2026-11-05').getAttribute('aria-disabled')).toBe('true');
      expect(cell('2026-11-15').hasAttribute('aria-disabled')).toBe(false);
      expect(cell('2026-11-25').getAttribute('aria-disabled')).toBe('true');
    });

    it('takes isDateDisabled for the calendar', () => {
      const { onChange } = renderPicker({ isDateDisabled: (date) => date === '2026-11-17' });
      open();
      fireEvent.click(cell('2026-11-17'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not limit what is typed: that is for the caller to check', () => {
      const { onChange } = renderPicker({ max: '2026-11-20' });
      focus(day());
      for (const digit of '25112026') press(document.activeElement as Element, digit);
      expect(onChange).toHaveBeenLastCalledWith('2026-11-25');
    });
  });

  describe('presets', () => {
    const presets = [
      { label: 'Today', value: '2026-11-11' as LocalDate },
      { label: 'Tomorrow', value: '2026-11-12' as LocalDate },
    ];

    it('shows a chip for each under the calendar, and chooses and closes on a press', () => {
      const { onChange } = renderPicker({ presets });
      open();
      fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }));
      expect(onChange).toHaveBeenCalledWith('2026-11-12');
      expect(day().value).toBe('12');
      expect(popup()?.dataset.state).toBe('closed');
    });

    it('marks the one that is the value as pressed', () => {
      renderPicker({ presets, defaultValue: '2026-11-11' });
      open();
      expect(screen.getByRole('button', { name: 'Today' }).getAttribute('aria-pressed')).toBe(
        'true',
      );
      expect(screen.getByRole('button', { name: 'Tomorrow' }).getAttribute('aria-pressed')).toBe(
        'false',
      );
    });

    it('disables one that is outside the limits', () => {
      renderPicker({ presets, min: '2026-11-12' });
      open();
      expect((screen.getByRole('button', { name: 'Today' }) as HTMLButtonElement).disabled).toBe(
        true,
      );
      expect((screen.getByRole('button', { name: 'Tomorrow' }) as HTMLButtonElement).disabled).toBe(
        false,
      );
    });

    it('has no row without presets', () => {
      renderPicker();
      open();
      expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
    });
  });

  describe('values', () => {
    it('is controlled by value, and a press in the calendar only asks', () => {
      const { onChange } = renderPicker({ value: '2026-11-20' });
      open();
      fireEvent.click(cell('2026-11-22'));
      expect(onChange).toHaveBeenCalledWith('2026-11-22');
      expect(day().value).toBe('20');
    });

    it('works as a controlled field in a parent', () => {
      function Parent() {
        const [value, setValue] = useState<LocalDate | null>(null);
        return (
          <>
            <DatePicker label="Due date" locale="en-GB" value={value} onChange={setValue} />
            <output>{value ?? 'none'}</output>
          </>
        );
      }
      render(<Parent />);
      open();
      fireEvent.click(cell('2026-11-14'));
      expect(screen.getByRole('status').textContent).toBe('2026-11-14');
      expect(day().value).toBe('14');
    });

    it('shows none for a value that is not a local date, and logs an error that names the fix', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderPicker({ value: '2026-11-20T00:00:00Z' as LocalDate });
      expect(day().value).toBe('');
      expect(String(error.mock.calls[0]?.[0])).toContain('DatePicker');
      expect(String(error.mock.calls[0]?.[0])).toContain('fromInstant');
    });
  });

  describe('disabled and read-only', () => {
    it('disables the button and the segments', () => {
      renderPicker({ isDisabled: true });
      expect((trigger() as HTMLButtonElement).disabled).toBe(true);
      expect(day().disabled).toBe(true);
    });

    it('is read-only: the button is off and Alt+Down does nothing', () => {
      renderPicker({ isReadOnly: true, defaultValue: '2026-11-20' });
      expect((trigger() as HTMLButtonElement).disabled).toBe(true);
      press(day(), 'ArrowDown', { altKey: true });
      expect(popup()).toBeNull();
    });
  });

  describe('labels and size', () => {
    it('takes the names of the button, the segments and the calendar buttons in another language', () => {
      renderPicker({
        labels: {
          calendar: 'Datum wählen',
          day: 'Tag',
          next: () => 'Nächster Monat',
          previous: () => 'Voriger Monat',
        },
      });
      expect(segment('Tag')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Datum wählen' }));
      expect(screen.getByRole('dialog', { name: 'Datum wählen', hidden: true })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Nächster Monat' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Voriger Monat' })).toBeTruthy();
    });

    it('keeps the calendar button names when only some labels are given', () => {
      renderPicker({ labels: { day: 'Tag' } });
      open();
      expect(screen.getByRole('button', { name: 'Next month' })).toBeTruthy();
    });

    it('gives the calendar the size of the field', () => {
      renderPicker({ size: 'more' });
      open();
      const calendar = screen.getByRole('group', { name: 'Calendar', hidden: true });
      expect(calendar.className).toMatch(/sizeMore/);
    });
  });
});
