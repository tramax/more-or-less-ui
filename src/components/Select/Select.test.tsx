import { createRef, useState, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, render, fireEvent, cleanup, screen } from '@testing-library/react';
import { Select, type SelectOption } from './Select';
import { filterOptions, findByPrefix, stepEnabled } from './useListboxNavigation';
import frameStyles from '../_shared/TextFieldFrame.module.css';
import labelStyles from '../_shared/FieldLabel.module.css';
import errorStyles from '../_shared/FieldError.module.css';
import spinnerStyles from '../_shared/Spinner.module.css';

const OPTIONS: SelectOption[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', description: 'Yellow' },
  { value: 'c', label: 'Cherry', isDisabled: true },
  { value: 'd', label: 'Date' },
  { value: 'e', label: 'Élderberry' },
];

type Props = ComponentProps<typeof Select>;

const renderSelect = (props: Partial<Props> = {}) => {
  const { container } = render(
    <Select {...({ label: 'Fruit', options: OPTIONS, ...props } as Props)} />,
  );
  return { container, root: container.firstElementChild as HTMLDivElement };
};

const combo = () => screen.getByRole('combobox');
const options = () => screen.queryAllByRole('option');
const optionNamed = (label: string) =>
  options().find((o) => o.textContent?.startsWith(label)) as HTMLElement;
const key = (k: string, init: object = {}) => fireEvent.keyDown(combo(), { key: k, ...init });
const activeLabel = () => {
  const id = combo().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id)?.textContent : undefined;
};
const hiddenValues = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((i) => i.value);

afterEach(cleanup);

describe('filterOptions / stepEnabled / findByPrefix', () => {
  it('filters by contains, ignoring case and diacritics', () => {
    expect(filterOptions(OPTIONS, 'elder').map((o) => o.value)).toEqual(['e']);
    expect(filterOptions(OPTIONS, 'AN').map((o) => o.value)).toEqual(['b']);
    expect(filterOptions(OPTIONS, '  ')).toBe(OPTIONS);
  });

  it('steps over disabled options and stops at the ends', () => {
    expect(stepEnabled(OPTIONS, 1, 1)?.value).toBe('d');
    expect(stepEnabled(OPTIONS, 3, -1)?.value).toBe('b');
    expect(stepEnabled(OPTIONS, 4, 1)).toBeUndefined();
    expect(stepEnabled(OPTIONS, -1, 1)?.value).toBe('a');
  });

  it('finds a prefix after the given index, wrapping, skipping disabled', () => {
    expect(findByPrefix(OPTIONS, 'c', -1)).toBeUndefined();
    expect(findByPrefix(OPTIONS, 'd', 0)?.value).toBe('d');
    expect(findByPrefix(OPTIONS, 'a', 0)?.value).toBe('a');
    expect(findByPrefix(OPTIONS, 'el', 0)?.value).toBe('e');
  });
});

describe('Select (single)', () => {
  describe('element', () => {
    it('renders a collapsed combobox button named by its label', () => {
      renderSelect({ placeholder: 'Pick one' });
      const button = screen.getByRole('combobox', { name: 'Fruit' });
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-haspopup')).toBe('listbox');
      expect(button.textContent).toBe('Pick one');
      expect(options()).toHaveLength(0);
    });

    it('links the label to the control', () => {
      const { container } = renderSelect();
      expect(container.querySelector('label')?.htmlFor).toBe(combo().id);
    });

    it('is named by aria-label when there is no visible label', () => {
      renderSelect({ label: undefined, 'aria-label': 'Choose fruit' } as never);
      expect(screen.getByRole('combobox', { name: 'Choose fruit' })).toBeTruthy();
    });

    it('forwards the ref to the control and className to the root', () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <Select ref={ref} label="Fruit" options={OPTIONS} className="mine" />,
      );
      expect(ref.current).toBe(combo());
      expect(container.firstElementChild?.classList.contains('mine')).toBe(true);
    });

    it('does not leak its own props to the DOM', () => {
      renderSelect({ isSearchable: true, isDisabled: true, isRequired: true, error: 'x' });
      for (const attr of ['issearchable', 'isdisabled', 'isrequired', 'error', 'options'])
        expect(combo().hasAttribute(attr)).toBe(false);
    });
  });

  describe('opening', () => {
    it('opens a listbox of options on click and closes on a second click', () => {
      renderSelect();
      fireEvent.click(combo());
      expect(combo().getAttribute('aria-expanded')).toBe('true');
      const listbox = screen.getByRole('listbox', { name: 'Fruit' });
      expect(combo().getAttribute('aria-controls')).toBe(listbox.id);
      expect(options().map((o) => o.textContent)).toEqual([
        'Apple',
        'BananaYellow',
        'Cherry',
        'Date',
        'Élderberry',
      ]);
      fireEvent.click(combo());
      expect(options()).toHaveLength(0);
    });

    it('opens on ArrowDown and Enter and Space, with the first enabled option active', () => {
      for (const k of ['ArrowDown', 'Enter', ' ']) {
        renderSelect();
        key(k);
        expect(combo().getAttribute('aria-expanded')).toBe('true');
        expect(activeLabel()).toBe('Apple');
        cleanup();
      }
    });

    it('starts on the selected option', () => {
      renderSelect({ defaultValue: 'd' });
      key('ArrowDown');
      expect(activeLabel()).toBe('Date');
      expect(optionNamed('Date').getAttribute('aria-selected')).toBe('true');
      expect(optionNamed('Apple').getAttribute('aria-selected')).toBe('false');
    });

    it('closes on Escape without changing the value, and on blur', () => {
      const onChange = vi.fn();
      renderSelect({ defaultValue: 'a', onChange });
      key('ArrowDown');
      key('ArrowDown');
      key('Escape');
      expect(options()).toHaveLength(0);
      expect(combo().textContent).toBe('Apple');
      key('ArrowDown');
      fireEvent.blur(combo());
      expect(options()).toHaveLength(0);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the popup for its exit animation, hidden from assistive tech, then removes it', () => {
      vi.useFakeTimers();
      try {
        renderSelect();
        fireEvent.click(combo());
        const popup = screen.getByRole('listbox').parentElement as HTMLElement;
        expect(popup.dataset.state).toBe('open');
        key('Escape');
        expect(combo().getAttribute('aria-expanded')).toBe('false');
        // Still in the DOM while it animates out, but not for anyone else
        expect(popup.isConnected).toBe(true);
        expect(popup.dataset.state).toBe('closed');
        expect(popup.getAttribute('aria-hidden')).toBe('true');
        expect(options()).toHaveLength(0);
        act(() => {
          vi.advanceTimersByTime(250);
        });
        expect(popup.isConnected).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not bring the popup back when a closed Select blurs', () => {
      renderSelect();
      fireEvent.blur(combo());
      expect(document.querySelector('[data-state]')).toBeNull();
    });

    it('does not open when disabled', () => {
      renderSelect({ isDisabled: true });
      expect((combo() as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(combo());
      expect(options()).toHaveLength(0);
    });
  });

  describe('keyboard', () => {
    it('moves the active option, skipping disabled ones and stopping at the ends', () => {
      renderSelect();
      key('ArrowDown');
      key('ArrowDown');
      expect(activeLabel()).toBe('BananaYellow');
      key('ArrowDown');
      expect(activeLabel()).toBe('Date');
      key('ArrowDown');
      key('ArrowDown');
      expect(activeLabel()).toBe('Élderberry');
      key('ArrowUp');
      expect(activeLabel()).toBe('Date');
    });

    it('jumps to the ends with Home and End', () => {
      renderSelect();
      key('End');
      expect(combo().getAttribute('aria-expanded')).toBe('true');
      expect(activeLabel()).toBe('Élderberry');
      key('Home');
      expect(activeLabel()).toBe('Apple');
    });

    it('marks exactly one option active', () => {
      renderSelect();
      key('ArrowDown');
      expect(options().filter((o) => o.hasAttribute('data-active'))).toHaveLength(1);
      key('ArrowDown');
      expect(options().filter((o) => o.hasAttribute('data-active'))).toHaveLength(1);
      expect(options()).toHaveLength(5);
    });

    it('selects the active option with Enter and closes', () => {
      const onChange = vi.fn();
      renderSelect({ onChange });
      key('ArrowDown');
      key('ArrowDown');
      key('Enter');
      expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
      expect(combo().textContent).toBe('Banana');
      expect(options()).toHaveLength(0);
    });

    it('takes the active option along on Tab', () => {
      const onChange = vi.fn();
      renderSelect({ onChange });
      key('ArrowDown');
      key('ArrowDown');
      key('Tab');
      expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
    });

    it('jumps by what is typed, and cycles on a repeated first letter', () => {
      vi.useFakeTimers();
      try {
        renderSelect({
          options: [
            { value: '1', label: 'Beta' },
            { value: '2', label: 'Bravo' },
            { value: '3', label: 'Delta' },
          ],
        });
        // Past the type-ahead window, a key starts a new search
        const typeAlone = (k: string) => {
          vi.advanceTimersByTime(600);
          key(k);
        };
        typeAlone('d');
        expect(combo().getAttribute('aria-expanded')).toBe('true');
        expect(activeLabel()).toBe('Delta');
        typeAlone('b');
        expect(activeLabel()).toBe('Beta');
        typeAlone('b');
        expect(activeLabel()).toBe('Bravo');
        typeAlone('b');
        expect(activeLabel()).toBe('Beta');
        // Within the window, keys add up: "br"
        key('r');
        expect(activeLabel()).toBe('Bravo');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('value', () => {
    it('selects by click, fires onChange, closes and shows the label (uncontrolled)', () => {
      const onChange = vi.fn();
      renderSelect({ onChange });
      fireEvent.click(combo());
      fireEvent.click(optionNamed('Date'));
      expect(onChange).toHaveBeenCalledExactlyOnceWith('d');
      expect(combo().textContent).toBe('Date');
      expect(options()).toHaveLength(0);
    });

    it('ignores a disabled option', () => {
      const onChange = vi.fn();
      renderSelect({ onChange });
      fireEvent.click(combo());
      expect(optionNamed('Cherry').getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(optionNamed('Cherry'));
      expect(onChange).not.toHaveBeenCalled();
      expect(options()).toHaveLength(5);
    });

    it('does not fire onChange for the option that is already selected', () => {
      const onChange = vi.fn();
      renderSelect({ defaultValue: 'a', onChange });
      fireEvent.click(combo());
      fireEvent.click(optionNamed('Apple'));
      expect(onChange).not.toHaveBeenCalled();
      expect(options()).toHaveLength(0);
    });

    it('follows `value` when controlled, and null shows the placeholder', () => {
      const Controlled = () => {
        const [value, setValue] = useState<string | null>('a');
        return (
          <>
            <Select label="Fruit" options={OPTIONS} value={value} placeholder="None" />
            <button onClick={() => setValue(value === null ? 'b' : null)}>flip</button>
            <output>{String(value)}</output>
          </>
        );
      };
      render(<Controlled />);
      expect(combo().textContent).toBe('Apple');
      // Controlled: picking does nothing until the parent says so
      fireEvent.click(combo());
      fireEvent.click(optionNamed('Date'));
      expect(combo().textContent).toBe('Apple');
      fireEvent.click(screen.getByText('flip'));
      expect(combo().textContent).toBe('None');
      fireEvent.click(screen.getByText('flip'));
      expect(combo().textContent).toBe('Banana');
    });

    it('treats a value that is not an option as nothing selected', () => {
      renderSelect({ value: 'zzz', placeholder: 'None' });
      expect(combo().textContent).toBe('None');
    });

    it('submits the value under `name` with a hidden input, and nothing when empty', () => {
      const { container } = renderSelect({ name: 'fruit', defaultValue: 'b' });
      expect(hiddenValues(container)).toEqual(['b']);
      expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')?.name).toBe('fruit');
      cleanup();
      expect(hiddenValues(renderSelect({ name: 'fruit' }).container)).toEqual([]);
    });
  });

  describe('field state', () => {
    it('marks an error with aria-invalid, the message and the invalid class', () => {
      const { root, container } = renderSelect({ error: 'Pick a fruit' });
      expect(combo().getAttribute('aria-invalid')).toBe('true');
      const message = container.querySelector(`.${errorStyles.error}`);
      expect(message?.textContent).toBe('Pick a fruit');
      expect(combo().getAttribute('aria-describedby')).toBe(message?.id);
      expect(root.classList.contains(frameStyles.invalid as string)).toBe(true);
    });

    it('marks required with aria-required and an asterisk, not native required', () => {
      const { container } = renderSelect({ isRequired: true });
      expect(combo().getAttribute('aria-required')).toBe('true');
      expect(combo().hasAttribute('required')).toBe(false);
      expect(container.querySelector(`.${labelStyles.asterisk}`)).toBeTruthy();
    });

    it('dims a disabled field', () => {
      const { root } = renderSelect({ isDisabled: true });
      expect(root.classList.contains(frameStyles.disabled as string)).toBe(true);
    });
  });
});

describe('Select (searchable)', () => {
  const type = (text: string) => fireEvent.change(combo(), { target: { value: text } });

  it('renders an input that shows the selected label', () => {
    renderSelect({ isSearchable: true, defaultValue: 'b' });
    const input = screen.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.value).toBe('Banana');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('opens on click and on typing, and filters the options', () => {
    renderSelect({ isSearchable: true });
    fireEvent.click(combo());
    expect(options()).toHaveLength(5);
    type('an');
    expect(options().map((o) => o.textContent)).toEqual(['BananaYellow']);
    expect(activeLabel()).toBe('BananaYellow');
    type('ELDER');
    expect(options().map((o) => o.textContent)).toEqual(['Élderberry']);
  });

  it('makes the first match active and commits it with Enter', () => {
    const onChange = vi.fn();
    renderSelect({ isSearchable: true, onChange });
    type('d');
    expect(options().length).toBeGreaterThan(0);
    expect(activeLabel()).toBe('Date');
    key('Enter');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('d');
    expect((combo() as HTMLInputElement).value).toBe('Date');
    expect(options()).toHaveLength(0);
  });

  it('says so when nothing matches, and Enter then does nothing', () => {
    const onChange = vi.fn();
    renderSelect({ isSearchable: true, onChange });
    type('zzz');
    expect(options()).toHaveLength(0);
    expect(screen.getByRole('status').textContent).toBe('No results');
    expect(combo().hasAttribute('aria-controls')).toBe(false);
    key('Enter');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('never takes the typed text as the value: Escape and blur put the label back', () => {
    const onChange = vi.fn();
    renderSelect({ isSearchable: true, defaultValue: 'a', onChange });
    type('Ban');
    expect((combo() as HTMLInputElement).value).toBe('Ban');
    key('Escape');
    expect((combo() as HTMLInputElement).value).toBe('Apple');
    type('Ban');
    fireEvent.blur(combo());
    expect((combo() as HTMLInputElement).value).toBe('Apple');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps Space, Home and End for the text', () => {
    renderSelect({ isSearchable: true });
    for (const k of [' ', 'Home', 'End']) {
      const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
      combo().dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it('selects by click', () => {
    const onChange = vi.fn();
    renderSelect({ isSearchable: true, onChange });
    fireEvent.click(combo());
    fireEvent.click(optionNamed('Banana'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
  });
});

describe('Select (onSearch)', () => {
  const type = (text: string) => fireEvent.change(combo(), { target: { value: text } });
  const MORE: SelectOption[] = [
    { value: 'x', label: 'Xigua' },
    { value: 'y', label: 'Yuzu' },
  ];
  const chips = (container: HTMLElement) =>
    [...container.querySelectorAll('button[aria-label^="Remove"]')].map((b) =>
      b.getAttribute('aria-label'),
    );

  it('is searchable without isSearchable, and reports the text instead of filtering', () => {
    const onSearch = vi.fn();
    renderSelect({ onSearch });
    expect(combo().tagName).toBe('INPUT');
    type('zzz');
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('zzz');
    // The options are the caller's matches: all of them stay
    expect(options()).toHaveLength(5);
  });

  it('does not leak its own props to the DOM', () => {
    renderSelect({ onSearch: vi.fn(), isLoading: true });
    for (const attr of ['onsearch', 'isloading']) expect(combo().hasAttribute(attr)).toBe(false);
  });

  it('reports an empty query when the list closes, but only after something was typed', () => {
    const onSearch = vi.fn();
    renderSelect({ onSearch });
    fireEvent.click(combo());
    key('Escape');
    expect(onSearch).not.toHaveBeenCalled();
    type('an');
    key('Escape');
    expect(onSearch).toHaveBeenNthCalledWith(1, 'an');
    expect(onSearch).toHaveBeenNthCalledWith(2, '');
    expect(onSearch).toHaveBeenCalledTimes(2);
  });

  it('keeps the selection shown when new results replace the list', () => {
    const onSearch = vi.fn();
    const { rerender } = render(
      <Select label="Fruit" options={OPTIONS} onSearch={onSearch} placeholder="None" />,
    );
    type('an');
    fireEvent.click(optionNamed('Banana'));
    // The caller resets its results in the same update as the pick
    rerender(<Select label="Fruit" options={MORE} onSearch={onSearch} placeholder="None" />);
    expect((combo() as HTMLInputElement).value).toBe('Banana');
    fireEvent.click(combo());
    expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'false']);
  });

  it('keeps a controlled selection shown when the list is swapped with the value', () => {
    const Controlled = () => {
      const [value, setValue] = useState<string | null>(null);
      const [list, setList] = useState(OPTIONS);
      return (
        <Select
          label="Fruit"
          options={list}
          value={value}
          onChange={(v) => {
            setValue(v);
            setList(MORE);
          }}
          onSearch={() => {}}
        />
      );
    };
    render(<Controlled />);
    fireEvent.click(combo());
    fireEvent.click(optionNamed('Date'));
    expect((combo() as HTMLInputElement).value).toBe('Date');
  });

  it('keeps chips across searches, in the order they were picked', () => {
    const onChange = vi.fn();
    const onSearch = vi.fn();
    const { container, rerender } = render(
      <Select label="Fruit" options={OPTIONS} isMultiple onChange={onChange} onSearch={onSearch} />,
    );
    fireEvent.click(combo());
    fireEvent.click(optionNamed('Date'));
    rerender(
      <Select label="Fruit" options={MORE} isMultiple onChange={onChange} onSearch={onSearch} />,
    );
    fireEvent.click(optionNamed('Xigua'));
    fireEvent.click(optionNamed('Yuzu'));
    fireEvent.click(optionNamed('Xigua'));
    expect(onChange.mock.calls.map(([v]) => v)).toEqual([
      ['d'],
      ['d', 'x'],
      ['d', 'x', 'y'],
      ['d', 'y'],
    ]);
    expect(chips(container)).toEqual(['Remove Date', 'Remove Yuzu']);
  });

  it('reports an empty query after a pick in a multiple Select that had text', () => {
    const onSearch = vi.fn();
    renderSelect({ isMultiple: true, onSearch });
    type('an');
    key('Enter');
    expect(onSearch).toHaveBeenLastCalledWith('');
    expect((combo() as HTMLInputElement).value).toBe('');
  });

  it('says it is loading when the list is empty, and keeps a stale list busy', () => {
    const { rerender } = render(<Select label="Fruit" options={[]} onSearch={vi.fn()} isLoading />);
    fireEvent.click(combo());
    expect(screen.getByRole('status').textContent).toBe('Loading…');
    rerender(<Select label="Fruit" options={[]} onSearch={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toBe('No results');
    rerender(<Select label="Fruit" options={OPTIONS} onSearch={vi.fn()} isLoading />);
    expect(screen.getByRole('listbox').getAttribute('aria-busy')).toBe('true');
    expect(options()).toHaveLength(5);
  });

  it('shows a spinner in the field while loading, even with results on screen', () => {
    const { container, rerender } = render(
      <Select label="Fruit" options={OPTIONS} onSearch={vi.fn()} />,
    );
    const spinner = () => container.querySelector(`.${spinnerStyles.spinner}`);
    expect(spinner()).toBeNull();
    rerender(<Select label="Fruit" options={OPTIONS} onSearch={vi.fn()} isLoading />);
    expect(spinner()).not.toBeNull();
    // Decoration: the busy state is on the listbox, the status text on an empty list
    expect(spinner()?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-loading]')).not.toBeNull();
    rerender(<Select label="Fruit" options={OPTIONS} onSearch={vi.fn()} />);
    expect(spinner()).toBeNull();
    expect(container.querySelector('[data-loading]')).toBeNull();
  });

  it('shows the spinner on a Select without onSearch too', () => {
    const { container } = renderSelect({ isLoading: true });
    expect(container.querySelector(`.${spinnerStyles.spinner}`)).not.toBeNull();
  });

  it('does not take the stale first option on Enter while loading', () => {
    const onChange = vi.fn();
    renderSelect({ onSearch: vi.fn(), isLoading: true, onChange });
    type('x');
    key('Enter');
    expect(onChange).not.toHaveBeenCalled();
    expect(combo().getAttribute('aria-expanded')).toBe('true');
  });
});

describe('Select (multiple)', () => {
  const chips = (container: HTMLElement) =>
    [...container.querySelectorAll('button[aria-label^="Remove"]')].map((b) =>
      b.getAttribute('aria-label'),
    );

  it('renders a read-only input after the chips, and no native keyboard on touch', () => {
    const { container } = renderSelect({ isMultiple: true, defaultValue: ['a', 'd'] });
    const input = screen.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.readOnly).toBe(true);
    expect(input.inputMode).toBe('none');
    expect(chips(container)).toEqual(['Remove Apple', 'Remove Date']);
  });

  it('shows the placeholder only while nothing is selected', () => {
    const { container } = renderSelect({ isMultiple: true, placeholder: 'Pick some' });
    expect((combo() as HTMLInputElement).placeholder).toBe('Pick some');
    fireEvent.click(combo());
    fireEvent.click(optionNamed('Apple'));
    expect((combo() as HTMLInputElement).placeholder).toBe('');
    expect(chips(container)).toEqual(['Remove Apple']);
  });

  it('toggles options and stays open, reporting values in options order', () => {
    const onChange = vi.fn();
    renderSelect({ isMultiple: true, onChange });
    fireEvent.click(combo());
    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true');
    fireEvent.click(optionNamed('Date'));
    fireEvent.click(optionNamed('Apple'));
    expect(onChange).toHaveBeenNthCalledWith(1, ['d']);
    expect(onChange).toHaveBeenNthCalledWith(2, ['a', 'd']);
    expect(options()).toHaveLength(5);
    fireEvent.click(optionNamed('Date'));
    expect(onChange).toHaveBeenLastCalledWith(['a']);
  });

  it('toggles the active option with Enter and Space, keeping the popup open', () => {
    const onChange = vi.fn();
    renderSelect({ isMultiple: true, onChange });
    key('ArrowDown');
    key('Enter');
    expect(onChange).toHaveBeenLastCalledWith(['a']);
    key('ArrowDown');
    key(' ');
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
    expect(combo().getAttribute('aria-expanded')).toBe('true');
    key('Escape');
    expect(options()).toHaveLength(0);
  });

  it('removes a value with its chip button', () => {
    const onChange = vi.fn();
    const { container } = renderSelect({ isMultiple: true, defaultValue: ['a', 'd'], onChange });
    fireEvent.click(screen.getByLabelText('Remove Apple'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['d']);
    expect(chips(container)).toEqual(['Remove Date']);
    // The click is on a chip, not the field, so the popup stays shut
    expect(options()).toHaveLength(0);
  });

  it('removes a value when its chip is clicked anywhere, not only on the button', () => {
    const onChange = vi.fn();
    const { container } = renderSelect({ isMultiple: true, defaultValue: ['a', 'd'], onChange });
    fireEvent.click(screen.getByText('Apple'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['d']);
    expect(chips(container)).toEqual(['Remove Date']);
    expect(options()).toHaveLength(0);
  });

  it('removes the last value with Backspace, but not a disabled one', () => {
    const onChange = vi.fn();
    const { container } = renderSelect({
      isMultiple: true,
      defaultValue: ['a', 'c', 'd'],
      onChange,
    });
    key('Backspace');
    expect(onChange).toHaveBeenLastCalledWith(['a', 'c']);
    key('Backspace');
    // Cherry is disabled, so Apple goes
    expect(onChange).toHaveBeenLastCalledWith(['c']);
    // Cherry stays, with no remove button of its own
    expect(chips(container)).toEqual([]);
    key('Backspace');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('gives a disabled option or a disabled Select no remove button', () => {
    const { container } = renderSelect({ isMultiple: true, defaultValue: ['a', 'c'] });
    expect(chips(container)).toEqual(['Remove Apple']);
    cleanup();
    const disabled = renderSelect({ isMultiple: true, defaultValue: ['a'], isDisabled: true });
    expect(chips(disabled.container)).toEqual([]);
  });

  it('follows `value` when controlled', () => {
    const { container } = renderSelect({ isMultiple: true, value: [] });
    expect(chips(container)).toEqual([]);
    fireEvent.click(combo());
    fireEvent.click(optionNamed('Apple'));
    expect(chips(container)).toEqual([]);
  });

  it('submits one hidden input per value', () => {
    const { container } = renderSelect({
      isMultiple: true,
      name: 'fruit',
      defaultValue: ['d', 'a'],
    });
    expect(hiddenValues(container)).toEqual(['a', 'd']);
  });

  describe('searchable', () => {
    it('filters, toggles with Enter, and clears the query for the next pick', () => {
      const onChange = vi.fn();
      renderSelect({ isMultiple: true, isSearchable: true, onChange });
      fireEvent.change(combo(), { target: { value: 'an' } });
      expect(options().map((o) => o.textContent)).toEqual(['BananaYellow']);
      key('Enter');
      expect(onChange).toHaveBeenCalledExactlyOnceWith(['b']);
      expect((combo() as HTMLInputElement).value).toBe('');
      expect(options()).toHaveLength(5);
    });

    it('does not remove a chip on Backspace while there is text to delete', () => {
      const onChange = vi.fn();
      renderSelect({ isMultiple: true, isSearchable: true, defaultValue: ['a'], onChange });
      fireEvent.change(combo(), { target: { value: 'x' } });
      key('Backspace');
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

describe('Select (isClearable)', () => {
  const clearButton = () => screen.queryByRole('button', { name: 'Clear', hidden: true });

  it('has no clear button unless asked, or with nothing to clear', () => {
    renderSelect({ defaultValue: 'a' });
    expect(clearButton()).toBeNull();
    cleanup();
    renderSelect({ isClearable: true });
    expect(clearButton()).toBeNull();
  });

  it('clears a single value, reports null, and keeps focus on the control', () => {
    const onChange = vi.fn();
    const { container } = renderSelect({
      isClearable: true,
      defaultValue: 'a',
      name: 'fruit',
      onChange,
    });
    fireEvent.click(clearButton() as HTMLElement);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
    expect(combo().textContent?.trim()).toBe('');
    expect(hiddenValues(container)).toEqual([]);
    expect(clearButton()).toBeNull();
    expect(document.activeElement).toBe(combo());
    expect(options()).toHaveLength(0);
  });

  it('clears a single value with Backspace', () => {
    const onChange = vi.fn();
    renderSelect({ isClearable: true, defaultValue: 'a', onChange });
    key('Backspace');
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('clears a searchable single value when its text is emptied', () => {
    const onChange = vi.fn();
    renderSelect({ isClearable: true, isSearchable: true, defaultValue: 'a', onChange });
    // Backspace edits the text rather than clearing
    key('Backspace');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(combo(), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('is not offered when required, disabled, or the selection is disabled', () => {
    renderSelect({ isClearable: true, defaultValue: 'a', isRequired: true });
    expect(clearButton()).toBeNull();
    cleanup();
    renderSelect({ isClearable: true, defaultValue: 'a', isDisabled: true });
    expect(clearButton()).toBeNull();
    cleanup();
    renderSelect({ isClearable: true, defaultValue: 'c' });
    expect(clearButton()).toBeNull();
  });

  it('removes every chip that can be removed from a multiple Select', () => {
    const onChange = vi.fn();
    renderSelect({ isMultiple: true, isClearable: true, defaultValue: ['a', 'c', 'd'], onChange });
    fireEvent.click(clearButton() as HTMLElement);
    // Cherry is disabled, so it stays
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['c']);
    expect(clearButton()).toBeNull();
  });

  it('follows `value` when controlled', () => {
    const onChange = vi.fn();
    renderSelect({ isClearable: true, value: 'a', onChange });
    fireEvent.click(clearButton() as HTMLElement);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
    expect(combo().textContent).toContain('Apple');
  });
});

describe('Select types', () => {
  it('types value and onChange by isMultiple', () => {
    // Never called: only compiled, so `pnpm typecheck` checks the union
    const check = () => (
      <>
        <Select label="a" options={[]} onChange={(v: string) => v} value="a" />
        <Select label="a" options={[]} isMultiple onChange={(v: string[]) => v} value={['a']} />
        {/* @ts-expect-error a multiple Select's onChange takes string[] */}
        <Select label="a" options={[]} isMultiple onChange={(v: string) => v} />
        {/* @ts-expect-error a single Select's value is a string */}
        <Select label="a" options={[]} value={['a']} />
        {/* @ts-expect-error onSearch is search, so the Select can't be told it isn't searchable */}
        <Select label="a" options={[]} isSearchable={false} onSearch={() => {}} />
        <Select label="a" options={[]} isSearchable onSearch={() => {}} />
        {/* @ts-expect-error a name is required: label, aria-label or aria-labelledby */}
        <Select options={[]} />
      </>
    );
    expect(check).toBeTypeOf('function');
  });
});
