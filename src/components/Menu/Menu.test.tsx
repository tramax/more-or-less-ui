import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Menu, type MenuItem } from './Menu';
import overlayStyles from '../_shared/Overlay.module.css';

const ITEMS: MenuItem[] = [
  { value: 'edit', label: 'Edit' },
  { value: 'duplicate', label: 'Duplicate', description: 'Make a copy' },
  { value: 'archive', label: 'Archive', isDisabled: true },
  { value: 'delete', label: 'Delete' },
];

const renderMenu = (props: Partial<Parameters<typeof Menu>[0]> = {}) =>
  render(
    <>
      <Menu
        items={ITEMS}
        onSelect={() => {}}
        trigger={<button type="button">Actions</button>}
        {...props}
      />
      <button type="button">Elsewhere</button>
    </>,
  );

const trigger = () => screen.getByRole('button', { name: 'Actions' });
const menu = () => screen.queryByRole('menu', { hidden: true });
const items = () => screen.queryAllByRole('menuitem', { hidden: true });
const item = (label: string) =>
  items().find((i) => i.textContent?.startsWith(label)) as HTMLElement;
const elsewhere = () => screen.getByRole('button', { name: 'Elsewhere' });
const labels = () => items().map((i) => i.textContent);
const focused = () => document.activeElement?.textContent;
const keyOn = (element: Element, key: string, init: object = {}) =>
  fireEvent.keyDown(element, { key, ...init });
// A press, as a pointer makes it (a keyboard's click has no `detail`)
const press = (element: Element) => fireEvent.click(element, { detail: 1 });
// Opened from the keyboard, with focus on the first item
const openByKeyboard = () => {
  act(() => trigger().focus());
  fireEvent.click(trigger());
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Menu', () => {
  describe('opening and closing', () => {
    it('is closed until the trigger is pressed, and then pressing it again closes it', () => {
      renderMenu();
      expect(menu()).toBeNull();
      press(trigger());
      expect(menu()?.dataset.state).toBe('open');
      expect(labels()).toEqual(['Edit', 'DuplicateMake a copy', 'Archive', 'Delete']);
      press(trigger());
      expect(menu()?.dataset.state).toBe('closed');
    });

    it('can start open', () => {
      renderMenu({ defaultIsOpen: true });
      expect(menu()?.dataset.state).toBe('open');
    });

    it('closes on Escape, on a press outside and on focus moving outside', () => {
      renderMenu();
      press(trigger());
      keyOn(document.body, 'Escape');
      expect(menu()?.dataset.state).toBe('closed');

      press(trigger());
      expect(menu()?.dataset.state).toBe('open');
      fireEvent.pointerDown(elsewhere());
      expect(menu()?.dataset.state).toBe('closed');

      press(trigger());
      act(() => elsewhere().focus());
      expect(menu()?.dataset.state).toBe('closed');
    });

    it('reports each change to onOpenChange', () => {
      const onOpenChange = vi.fn();
      renderMenu({ onOpenChange });
      press(trigger());
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      keyOn(document.body, 'Escape');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('stays as it is when controlled and the caller does not follow', () => {
      const onOpenChange = vi.fn();
      renderMenu({ isOpen: false, onOpenChange });
      press(trigger());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(menu()).toBeNull();
    });
  });

  describe('choosing', () => {
    it('reports the value, closes, and gives focus back to the trigger', () => {
      const onSelect = vi.fn();
      renderMenu({ onSelect });
      openByKeyboard();
      fireEvent.click(item('Delete'));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('delete');
      expect(menu()?.dataset.state).toBe('closed');
      expect(document.activeElement).toBe(trigger());
    });

    it('does not choose a disabled item', () => {
      const onSelect = vi.fn();
      renderMenu({ onSelect });
      press(trigger());
      expect((item('Archive') as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(item('Archive'));
      expect(onSelect).not.toHaveBeenCalled();
      expect(menu()?.dataset.state).toBe('open');
    });
  });

  describe('focus', () => {
    it('lands on the first item when the keyboard opens it', () => {
      renderMenu();
      openByKeyboard();
      expect(focused()).toBe('Edit');
    });

    it('lands on the menu, with no item lit, when a press opens it', () => {
      renderMenu();
      press(trigger());
      expect(document.activeElement).toBe(menu());
      expect(menu()?.tabIndex).toBe(-1);
    });

    it('does not take focus when it starts open', () => {
      renderMenu({ defaultIsOpen: true });
      expect(document.activeElement).toBe(document.body);
    });

    it('goes back to the trigger on Escape', () => {
      renderMenu();
      openByKeyboard();
      keyOn(document.body, 'Escape');
      expect(document.activeElement).toBe(trigger());
    });

    it('does not go back after a press elsewhere', () => {
      renderMenu();
      openByKeyboard();
      fireEvent.pointerDown(elsewhere());
      expect(document.activeElement).not.toBe(trigger());
    });

    it('closes on Tab, with focus back on the trigger for the browser to move on from', () => {
      renderMenu();
      openByKeyboard();
      keyOn(item('Edit'), 'Tab');
      expect(menu()?.dataset.state).toBe('closed');
      expect(document.activeElement).toBe(trigger());
    });

    it('lights the item the pointer moves over', () => {
      renderMenu();
      press(trigger());
      fireEvent.mouseMove(item('Delete'));
      expect(document.activeElement).toBe(item('Delete'));
    });
  });

  describe('keyboard', () => {
    it('opens on ArrowDown at the first item and on ArrowUp at the last', () => {
      renderMenu();
      act(() => trigger().focus());
      keyOn(trigger(), 'ArrowDown');
      expect(menu()?.dataset.state).toBe('open');
      expect(focused()).toBe('Edit');
      keyOn(document.body, 'Escape');

      keyOn(trigger(), 'ArrowUp');
      expect(focused()).toBe('Delete');
    });

    it('moves into an open menu from the trigger with the arrows', () => {
      renderMenu();
      press(trigger());
      keyOn(trigger(), 'ArrowDown');
      expect(focused()).toBe('Edit');
    });

    it('steps with the arrows over a disabled item and stops at the ends', () => {
      renderMenu();
      openByKeyboard();
      keyOn(item('Edit'), 'ArrowUp');
      expect(focused()).toBe('Edit');
      keyOn(item('Edit'), 'ArrowDown');
      expect(focused()).toBe('DuplicateMake a copy');
      keyOn(document.activeElement as Element, 'ArrowDown');
      expect(focused()).toBe('Delete');
      keyOn(document.activeElement as Element, 'ArrowDown');
      expect(focused()).toBe('Delete');
      keyOn(document.activeElement as Element, 'ArrowUp');
      expect(focused()).toBe('DuplicateMake a copy');
    });

    it('starts from an end when the arrows are pressed on the menu itself', () => {
      renderMenu();
      press(trigger());
      keyOn(menu() as Element, 'ArrowDown');
      expect(focused()).toBe('Edit');
      act(() => (menu() as HTMLElement).focus());
      keyOn(menu() as Element, 'ArrowUp');
      expect(focused()).toBe('Delete');
    });

    it('goes to the first and last enabled item with Home and End', () => {
      renderMenu();
      openByKeyboard();
      keyOn(item('Edit'), 'End');
      expect(focused()).toBe('Delete');
      keyOn(item('Delete'), 'Home');
      expect(focused()).toBe('Edit');
    });

    it('jumps to a label by typing, skipping disabled items', () => {
      vi.useFakeTimers();
      renderMenu();
      openByKeyboard();
      keyOn(item('Edit'), 'd');
      expect(focused()).toBe('DuplicateMake a copy');
      act(() => vi.advanceTimersByTime(600));
      keyOn(item('Duplicate'), 'd');
      expect(focused()).toBe('Delete');
      // Archive starts with "a" but is disabled, so there is nowhere to go
      act(() => vi.advanceTimersByTime(600));
      keyOn(item('Delete'), 'a');
      expect(focused()).toBe('Delete');
    });

    it('lets a Space with nothing typed choose the item, and a Space while typing be text', () => {
      vi.useFakeTimers();
      renderMenu();
      openByKeyboard();
      // fireEvent returns false when the event was cancelled
      expect(fireEvent.keyDown(item('Edit'), { key: ' ' })).toBe(true);
      keyOn(item('Edit'), 'd');
      expect(fireEvent.keyDown(item('Duplicate'), { key: ' ' })).toBe(false);
    });
  });

  describe('trigger', () => {
    it('names the menu, reports it and whether it is open', () => {
      renderMenu();
      expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(trigger().getAttribute('aria-controls')).toBeNull();
      press(trigger());
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      expect(trigger().getAttribute('aria-controls')).toBe(menu()?.id);
      expect(menu()?.getAttribute('aria-labelledby')).toBe(trigger().id);
      expect(screen.getByRole('menu', { name: 'Actions', hidden: true })).toBe(menu());
    });

    it('keeps the trigger’s own id, handlers, style and ref', () => {
      const onClick = vi.fn();
      const ref = createRef<HTMLButtonElement>();
      renderMenu({
        trigger: (
          <button type="button" id="mine" ref={ref} onClick={onClick} style={{ color: 'red' }}>
            Actions
          </button>
        ),
      });
      press(trigger());
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(ref.current).toBe(trigger());
      expect(trigger().id).toBe('mine');
      expect(menu()?.getAttribute('aria-labelledby')).toBe('mine');
      expect(trigger().style.color).toBe('red');
    });

    it('does not open when the trigger’s own click handler prevents it', () => {
      renderMenu({
        trigger: (
          <button type="button" onClick={(event) => event.preventDefault()}>
            Actions
          </button>
        ),
      });
      press(trigger());
      expect(menu()).toBeNull();
    });
  });

  describe('items', () => {
    it('are menuitem buttons out of the tab order, with the description linked', () => {
      renderMenu({ defaultIsOpen: true });
      expect(items().every((i) => i.tagName === 'BUTTON' && i.tabIndex === -1)).toBe(true);
      const description = item('Duplicate').getAttribute('aria-describedby');
      expect(document.getElementById(description ?? '')?.textContent).toBe('Make a copy');
      expect(item('Edit').getAttribute('aria-describedby')).toBeNull();
    });

    it('show an icon, hidden from assistive tech', () => {
      renderMenu({
        defaultIsOpen: true,
        items: [{ value: 'a', label: 'Edit', icon: <svg data-testid="icon" /> }],
      });
      expect(screen.getByTestId('icon').parentElement?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('menu', () => {
    const has = (name: string) =>
      menu()?.classList.contains((overlayStyles as Record<string, string | undefined>)[name] ?? '');

    it('is on the overlay, below the trigger and aligned to its start by default', () => {
      renderMenu();
      press(trigger());
      expect(has('overlay')).toBe(true);
      expect(has('bottomStart')).toBe(true);
    });

    it('can be placed above and centered', () => {
      renderMenu({ placement: 'top', align: 'center' });
      press(trigger());
      expect(has('top')).toBe(true);
    });
  });
});
