import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { LocalDate, LocalMonth } from '../_shared/dateValue';
import sizes from '../_shared/Size.module.css';
import { Calendar, type CalendarProps } from './Calendar';

beforeEach(() => {
  // Wednesday 11 November 2026, midday: the calendar's "today"
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const renderCalendar = (props: CalendarProps = {}) => {
  const onChange = vi.fn();
  const onVisibleMonthChange = vi.fn();
  const view = render(
    <Calendar
      locale="en-US"
      firstDayOfWeek={1}
      onChange={onChange}
      onVisibleMonthChange={onVisibleMonthChange}
      {...props}
    />,
  );
  return { onChange, onVisibleMonthChange, ...view };
};

const cell = (date: string) => document.querySelector<HTMLButtonElement>(`[data-key="${date}"]`)!;
// The header's name: a button over the days and the months, plain text over the years
const title = () => document.querySelector<HTMLElement>('[aria-live] > *')!;
const press = (date: string) => fireEvent.click(cell(date));
const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(target, { key: name, ...init });

describe('Calendar', () => {
  describe('structure', () => {
    it('is a group named Calendar with a grid of the month, labelled by its title', () => {
      renderCalendar();
      expect(screen.getByRole('group', { name: 'Calendar' })).toBeTruthy();
      expect(screen.getByRole('grid', { name: 'November 2026' })).toBeTruthy();
      expect(title().textContent).toBe('November 2026');
    });

    it('draws six weeks of seven days, starting on the first day of the week', () => {
      renderCalendar();
      const grid = screen.getByRole('grid');
      expect(within(grid).getAllByRole('gridcell')).toHaveLength(42);
      const headers = within(grid)
        .getAllByRole('columnheader')
        .map((h) => h.textContent);
      expect(headers).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
      // 1 November 2026 is a Sunday
      expect(within(grid).getAllByRole('gridcell')[0]?.querySelector('button')?.dataset.key).toBe(
        '2026-10-26',
      );
    });

    it('starts the week where firstDayOfWeek says', () => {
      renderCalendar({ firstDayOfWeek: 0 });
      const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
      expect(headers[0]).toBe('Sun');
      expect(cell('2026-11-01').closest('tr')?.querySelector('button')?.dataset.key).toBe(
        '2026-11-01',
      );
    });

    it('names each day in full for a screen reader, and shows its number', () => {
      renderCalendar();
      const day = cell('2026-11-11');
      expect(day.getAttribute('aria-label')).toBe('Wednesday, November 11, 2026');
      expect(day.textContent).toBe('11');
    });

    it('marks today, and only today', () => {
      renderCalendar();
      expect(cell('2026-11-11').getAttribute('aria-current')).toBe('date');
      expect(document.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
    });

    it('takes another name, and aria-labelledby replaces the default', () => {
      renderCalendar({ 'aria-label': 'Date of birth' });
      expect(screen.getByRole('group', { name: 'Date of birth' })).toBeTruthy();
      cleanup();
      render(
        <>
          <h2 id="when">When</h2>
          <Calendar aria-labelledby="when" />
        </>,
      );
      expect(screen.getByRole('group', { name: 'When' }).hasAttribute('aria-label')).toBe(false);
    });

    it('passes other props and the ref to the root, and the size class', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Calendar ref={ref} className="x" data-testid="cal" size="more" />);
      const root = screen.getByTestId('cal');
      expect(ref.current).toBe(root);
      expect(root.classList.contains('x')).toBe(true);
      expect(root.classList.contains(sizes.sizeMore!)).toBe(true);
    });

    it('uses the normal size by default', () => {
      render(<Calendar data-testid="cal" />);
      expect(screen.getByTestId('cal').classList.contains(sizes.sizeNormal!)).toBe(true);
    });
  });

  describe('locale', () => {
    it('writes the names in the locale', () => {
      renderCalendar({ locale: 'fr-FR' });
      expect(title().textContent).toBe('novembre 2026');
      expect(cell('2026-11-11').getAttribute('aria-label')).toContain('mercredi');
    });

    it('falls back to the browser for a locale it does not know', () => {
      renderCalendar({ locale: 'not a locale' });
      expect(title().textContent).toMatch(/2026/);
    });
  });

  describe('choosing', () => {
    it('calls onChange with the local date pressed', () => {
      const { onChange } = renderCalendar();
      press('2026-11-20');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('2026-11-20');
    });

    it('marks the chosen date when uncontrolled, and moves it', () => {
      renderCalendar({ defaultValue: '2026-11-05' });
      expect(cell('2026-11-05').closest('td')?.getAttribute('aria-selected')).toBe('true');
      press('2026-11-20');
      expect(cell('2026-11-20').closest('td')?.getAttribute('aria-selected')).toBe('true');
      expect(cell('2026-11-05').closest('td')?.getAttribute('aria-selected')).toBe('false');
    });

    it('does not move the chosen date by itself when controlled', () => {
      const { onChange } = renderCalendar({ value: '2026-11-05' });
      press('2026-11-20');
      expect(onChange).toHaveBeenCalledWith('2026-11-20');
      expect(cell('2026-11-05').closest('td')?.getAttribute('aria-selected')).toBe('true');
      expect(cell('2026-11-20').closest('td')?.getAttribute('aria-selected')).toBe('false');
    });

    it('calls onChange again for the date that is already chosen', () => {
      const { onChange } = renderCalendar({ defaultValue: '2026-11-05' });
      press('2026-11-05');
      expect(onChange).toHaveBeenCalledWith('2026-11-05');
    });

    it('shows no date chosen for null', () => {
      renderCalendar({ value: null });
      expect(document.querySelectorAll('td[aria-selected="true"]')).toHaveLength(0);
    });

    it('opens on the month of the chosen date', () => {
      renderCalendar({ defaultValue: '1988-03-14' });
      expect(title().textContent).toBe('March 1988');
      expect(cell('1988-03-14').getAttribute('tabindex')).toBe('0');
    });

    it('follows a chosen date set from outside', () => {
      const Outside = () => {
        const [value, setValue] = useState<LocalDate | null>('2026-11-05');
        return (
          <>
            <button onClick={() => setValue('2027-02-14')}>set</button>
            <Calendar value={value} locale="en-US" />
          </>
        );
      };
      render(<Outside />);
      expect(title().textContent).toBe('November 2026');
      fireEvent.click(screen.getByText('set'));
      expect(title().textContent).toBe('February 2027');
    });

    it('goes to the month of a day pressed in the next or previous month', () => {
      const { onChange, onVisibleMonthChange } = renderCalendar();
      press('2026-10-28');
      expect(onChange).toHaveBeenCalledWith('2026-10-28');
      expect(title().textContent).toBe('October 2026');
      expect(onVisibleMonthChange).toHaveBeenCalledWith('2026-10');
    });
  });

  describe('turning the page', () => {
    it('moves a month with the buttons, and says which', () => {
      const { onVisibleMonthChange } = renderCalendar();
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(title().textContent).toBe('December 2026');
      expect(onVisibleMonthChange).toHaveBeenLastCalledWith('2026-12');
      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
      expect(title().textContent).toBe('October 2026');
      expect(onVisibleMonthChange).toHaveBeenLastCalledWith('2026-10');
    });

    it('crosses a year', () => {
      renderCalendar({ defaultVisibleMonth: '2026-12' });
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(title().textContent).toBe('January 2027');
    });

    it('takes the names of the buttons from labels', () => {
      renderCalendar({
        labels: { previous: (v) => `Avant (${v})`, next: (v) => `Après (${v})` },
      });
      expect(screen.getByRole('button', { name: 'Avant (days)' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Après (days)' })).toBeTruthy();
    });

    it('starts on defaultVisibleMonth, with a day of it to land on', () => {
      renderCalendar({ defaultVisibleMonth: '2030-06' });
      expect(title().textContent).toBe('June 2030');
      expect(document.querySelector('[tabindex="0"][data-cell]')).toBeTruthy();
    });

    it('is the parent’s when visibleMonth is given', () => {
      const Parent = () => {
        const [month, setMonth] = useState<LocalMonth>('2026-11');
        return (
          <>
            <button onClick={() => setMonth('2027-05')}>jump</button>
            <Calendar visibleMonth={month} onVisibleMonthChange={setMonth} locale="en-US" />
          </>
        );
      };
      render(<Parent />);
      expect(title().textContent).toBe('November 2026');
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(title().textContent).toBe('December 2026');
      fireEvent.click(screen.getByText('jump'));
      expect(title().textContent).toBe('May 2027');
    });

    it('does not turn the page itself when visibleMonth is not updated', () => {
      const { onVisibleMonthChange } = renderCalendar({ visibleMonth: '2026-11' });
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(onVisibleMonthChange).toHaveBeenCalledWith('2026-12');
      expect(title().textContent).toBe('November 2026');
    });
  });

  describe('limits', () => {
    it('dims dates outside min and max and does not choose them', () => {
      const { onChange } = renderCalendar({ min: '2026-11-05', max: '2026-11-20' });
      expect(cell('2026-11-04').getAttribute('aria-disabled')).toBe('true');
      expect(cell('2026-11-21').getAttribute('aria-disabled')).toBe('true');
      expect(cell('2026-11-05').hasAttribute('aria-disabled')).toBe(false);
      press('2026-11-04');
      press('2026-11-21');
      expect(onChange).not.toHaveBeenCalled();
      press('2026-11-20');
      expect(onChange).toHaveBeenCalledWith('2026-11-20');
    });

    it('stops the previous and next buttons at the limits', () => {
      renderCalendar({ min: '2026-10-15', max: '2026-12-15' });
      const previous = screen.getByRole('button', { name: 'Previous month' }) as HTMLButtonElement;
      const next = screen.getByRole('button', { name: 'Next month' }) as HTMLButtonElement;
      expect(previous.disabled).toBe(false);
      expect(next.disabled).toBe(false);
      fireEvent.click(previous);
      expect(title().textContent).toBe('October 2026');
      expect(previous.disabled).toBe(true);
      fireEvent.click(next);
      fireEvent.click(next);
      expect(title().textContent).toBe('December 2026');
      expect(next.disabled).toBe(true);
    });

    it('does not choose a date isDateDisabled refuses', () => {
      const { onChange } = renderCalendar({
        isDateDisabled: (date) => date.endsWith('-13'),
      });
      expect(cell('2026-11-13').getAttribute('aria-disabled')).toBe('true');
      press('2026-11-13');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('lets the keyboard reach a date that cannot be chosen', () => {
      renderCalendar({ isDateDisabled: (date) => date === '2026-11-12' });
      key(cell('2026-11-11'), 'ArrowRight');
      expect(document.activeElement).toBe(cell('2026-11-12'));
    });

    it('keeps the keyboard inside min and max', () => {
      renderCalendar({ min: '2026-11-10' });
      key(cell('2026-11-11'), 'ArrowLeft');
      expect(document.activeElement).toBe(cell('2026-11-10'));
      key(cell('2026-11-10'), 'ArrowLeft');
      expect(document.activeElement).toBe(cell('2026-11-10'));
    });

    it('ignores a min that is not a local date, and says so', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderCalendar({ min: '2026-11-11T00:00:00Z' as never });
      expect(cell('2026-11-01').hasAttribute('aria-disabled')).toBe(false);
      expect(error).toHaveBeenCalled();
    });
  });

  describe('keyboard', () => {
    it('has one tab stop: the date the keyboard is on, today to start', () => {
      renderCalendar();
      const stops = document.querySelectorAll('[data-cell][tabindex="0"]');
      expect(stops).toHaveLength(1);
      expect((stops[0] as HTMLElement).dataset.key).toBe('2026-11-11');
    });

    it('starts on the chosen date', () => {
      renderCalendar({ defaultValue: '2026-11-20' });
      expect(cell('2026-11-20').getAttribute('tabindex')).toBe('0');
      expect(cell('2026-11-11').getAttribute('tabindex')).toBe('-1');
    });

    it('moves by a day with left and right, and by a week with up and down', () => {
      renderCalendar();
      key(cell('2026-11-11'), 'ArrowRight');
      expect(document.activeElement).toBe(cell('2026-11-12'));
      key(cell('2026-11-12'), 'ArrowDown');
      expect(document.activeElement).toBe(cell('2026-11-19'));
      key(cell('2026-11-19'), 'ArrowLeft');
      expect(document.activeElement).toBe(cell('2026-11-18'));
      key(cell('2026-11-18'), 'ArrowUp');
      expect(document.activeElement).toBe(cell('2026-11-11'));
    });

    it('moves to the start and the end of the week with Home and End', () => {
      renderCalendar();
      key(cell('2026-11-11'), 'Home');
      expect(document.activeElement).toBe(cell('2026-11-09'));
      key(cell('2026-11-09'), 'End');
      expect(document.activeElement).toBe(cell('2026-11-15'));
    });

    it('turns the page when the arrow goes past the end of the month', () => {
      const { onVisibleMonthChange } = renderCalendar({ defaultValue: '2026-11-30' });
      key(cell('2026-11-30'), 'ArrowRight');
      expect(title().textContent).toBe('December 2026');
      expect(document.activeElement).toBe(cell('2026-12-01'));
      expect(onVisibleMonthChange).toHaveBeenCalledWith('2026-12');
    });

    it('moves a month with Page Down and Up, and a year with Shift', () => {
      renderCalendar({ defaultValue: '2026-01-31' });
      key(cell('2026-01-31'), 'PageDown');
      expect(title().textContent).toBe('February 2026');
      // The 31st does not exist in February: the last day
      expect(document.activeElement).toBe(cell('2026-02-28'));
      key(cell('2026-02-28'), 'PageUp');
      expect(title().textContent).toBe('January 2026');
      key(document.activeElement!, 'PageDown', { shiftKey: true });
      expect(title().textContent).toBe('January 2027');
    });

    it('does not choose a date by moving to it, only by Enter or a press', () => {
      const { onChange } = renderCalendar();
      key(cell('2026-11-11'), 'ArrowRight');
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.click(document.activeElement!);
      expect(onChange).toHaveBeenCalledWith('2026-11-12');
    });

    it('ignores other keys', () => {
      const { onChange } = renderCalendar();
      key(cell('2026-11-11'), 'a');
      expect(onChange).not.toHaveBeenCalled();
      expect(title().textContent).toBe('November 2026');
    });
  });

  describe('months and years', () => {
    it('opens the months from the title, on the month shown', () => {
      renderCalendar();
      fireEvent.click(title());
      expect(screen.queryByRole('grid')).toBeNull();
      const group = screen.getByRole('group', { name: '2026' });
      expect(within(group).getAllByRole('button')).toHaveLength(12);
      const current = within(group).getByRole('button', { name: 'November 2026' });
      expect(current.getAttribute('aria-current')).toBe('true');
      expect(current.getAttribute('tabindex')).toBe('0');
      expect(document.activeElement).toBe(current);
    });

    it('goes to the month chosen, keeping the day where it can', () => {
      const { onVisibleMonthChange } = renderCalendar({ defaultValue: '2026-11-30' });
      fireEvent.click(title());
      fireEvent.click(screen.getByRole('button', { name: 'February 2026' }));
      expect(screen.getByRole('grid', { name: 'February 2026' })).toBeTruthy();
      expect(cell('2026-02-28').getAttribute('tabindex')).toBe('0');
      expect(onVisibleMonthChange).toHaveBeenCalledWith('2026-02');
    });

    it('moves a year with the buttons in the months view, without moving the month shown', () => {
      const { onVisibleMonthChange } = renderCalendar();
      fireEvent.click(title());
      fireEvent.click(screen.getByRole('button', { name: 'Previous year' }));
      expect(title().textContent).toBe('2025');
      expect(screen.getByRole('button', { name: 'March 2025' })).toBeTruthy();
      expect(onVisibleMonthChange).not.toHaveBeenCalled();
    });

    it('reaches a birthday decades back in three presses', () => {
      const { onChange } = renderCalendar();
      fireEvent.click(title()); // the months of 2026
      fireEvent.click(title()); // the years 2017 to 2028
      expect(screen.getByText('2017 – 2028')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Previous years' }));
      fireEvent.click(screen.getByRole('button', { name: 'Previous years' }));
      fireEvent.click(screen.getByRole('button', { name: 'Previous years' }));
      expect(screen.getByText('1981 – 1992')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: '1988' }));
      fireEvent.click(screen.getByRole('button', { name: 'March 1988' }));
      expect(title().textContent).toBe('March 1988');
      press('1988-03-11');
      expect(onChange).toHaveBeenCalledWith('1988-03-11');
    });

    it('marks the year shown in the years view, and dims years outside min and max', () => {
      renderCalendar({ min: '2020-01-01', max: '2027-12-31' });
      fireEvent.click(title());
      fireEvent.click(title());
      expect(screen.getByRole('button', { name: '2026' }).getAttribute('aria-current')).toBe(
        'true',
      );
      expect(screen.getByRole('button', { name: '2019' }).getAttribute('aria-disabled')).toBe(
        'true',
      );
      expect(screen.getByRole('button', { name: '2028' }).getAttribute('aria-disabled')).toBe(
        'true',
      );
      expect(screen.getByRole('button', { name: '2021' }).hasAttribute('aria-disabled')).toBe(
        false,
      );
    });

    it('does not go to a month outside min and max', () => {
      renderCalendar({ min: '2026-06-10' });
      fireEvent.click(title());
      const may = screen.getByRole('button', { name: 'May 2026' });
      expect(may.getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(may);
      expect(screen.queryByRole('grid')).toBeNull();
      expect(screen.getByRole('button', { name: 'June 2026' }).hasAttribute('aria-disabled')).toBe(
        false,
      );
    });

    it('walks the grid with the arrows: 1 left and right, 3 up and down', () => {
      renderCalendar();
      fireEvent.click(title());
      const current = () => screen.getByRole('button', { name: 'November 2026' });
      key(current(), 'ArrowLeft');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'October 2026' }));
      key(document.activeElement!, 'ArrowUp');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'July 2026' }));
      key(document.activeElement!, 'Home');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'January 2026' }));
      key(document.activeElement!, 'End');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'December 2026' }));
    });

    it('turns to the next year when the arrow goes past December', () => {
      renderCalendar();
      fireEvent.click(title());
      key(screen.getByRole('button', { name: 'November 2026' }), 'ArrowDown');
      expect(title().textContent).toBe('2027');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'February 2027' }));
    });

    it('goes back a step on Escape, and the Escape is spent', () => {
      const outer = vi.fn();
      document.addEventListener('keydown', outer);
      renderCalendar();
      fireEvent.click(title());
      fireEvent.click(title());
      key(screen.getByRole('button', { name: '2026' }), 'Escape');
      expect(screen.getByRole('group', { name: '2026' })).toBeTruthy();
      key(screen.getByRole('button', { name: 'November 2026' }), 'Escape');
      expect(screen.getByRole('grid')).toBeTruthy();
      expect(outer).not.toHaveBeenCalled();
      document.removeEventListener('keydown', outer);
    });
  });

  describe('value', () => {
    it('shows none for a value that carries a time zone, and names the fix', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderCalendar({ value: '2026-11-11T13:30:00.000Z' as never });
      expect(document.querySelectorAll('td[aria-selected="true"]')).toHaveLength(0);
      expect(String(error.mock.calls[0]?.[0])).toContain('fromInstant');
    });

    it('shows none for a day that does not exist', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderCalendar({ value: '2026-02-30' as never });
      expect(document.querySelectorAll('td[aria-selected="true"]')).toHaveLength(0);
      expect(error).toHaveBeenCalled();
    });

    it('stays controlled when the value is invalid: the user cannot type over it', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      renderCalendar({ value: 'nope' as never });
      press('2026-11-20');
      expect(document.querySelectorAll('td[aria-selected="true"]')).toHaveLength(0);
    });

    it('says nothing for a good value', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderCalendar({ value: '2026-11-11', min: '2026-01-01', max: '2026-12-31' });
      expect(error).not.toHaveBeenCalled();
    });
  });

  describe('disabled', () => {
    it('disables every button', () => {
      renderCalendar({ isDisabled: true });
      expect(screen.getAllByRole('button').every((b) => (b as HTMLButtonElement).disabled)).toBe(
        true,
      );
    });
  });
});
