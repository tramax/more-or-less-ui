import { createRef, useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Tabs, type TabItem, type TabsProps } from './Tabs';
import styles from './Tabs.module.css';

const ITEMS: TabItem[] = [
  { value: 'account', label: 'Account', content: <p>Account settings</p> },
  { value: 'billing', label: 'Billing', content: <p>Billing settings</p> },
  { value: 'team', label: 'Team', content: <p>Team settings</p>, isDisabled: true },
  {
    value: 'security',
    label: 'Security',
    icon: <svg data-testid="icon" />,
    content: <p>Security</p>,
  },
];

// The selection is the parent's, so a test that clicks needs one. `value` is where it starts.
const Parent = ({ value: initial, onChange, ...props }: TabsProps) => {
  const [value, setValue] = useState(initial);
  return (
    <Tabs
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

const renderTabs = ({
  value = 'account',
  onChange = () => {},
  ...props
}: Partial<TabsProps> = {}) =>
  render(
    <Parent items={ITEMS} aria-label="Settings" value={value} onChange={onChange} {...props} />,
  );

const tab = (name: string) => screen.getByRole('tab', { name });
const panel = () => screen.getByRole('tabpanel');
const keyOn = (element: Element, key: string, init: object = {}) =>
  fireEvent.keyDown(element, { key, ...init });

afterEach(cleanup);

describe('Tabs', () => {
  describe('structure', () => {
    it('is a tablist of tabs with one panel, named by the selected tab', () => {
      renderTabs();
      expect(screen.getByRole('tablist', { name: 'Settings' })).toBeTruthy();
      expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
        'Account',
        'Billing',
        'Team',
        'Security',
      ]);
      expect(panel().textContent).toBe('Account settings');
      expect(panel().getAttribute('aria-labelledby')).toBe(tab('Account').id);
    });

    it('selects the first tab, and links only it to the panel', () => {
      renderTabs();
      expect(tab('Account').getAttribute('aria-selected')).toBe('true');
      expect(tab('Billing').getAttribute('aria-selected')).toBe('false');
      expect(tab('Account').getAttribute('aria-controls')).toBe(panel().id);
      expect(tab('Billing').hasAttribute('aria-controls')).toBe(false);
    });

    it('falls back to the first enabled tab when the value names none', () => {
      renderTabs({ value: 'nope' });
      expect(panel().textContent).toBe('Account settings');
    });

    it('skips a disabled first tab when it falls back', () => {
      renderTabs({ value: 'nope', items: [{ ...ITEMS[0]!, isDisabled: true }, ...ITEMS.slice(1)] });
      expect(panel().textContent).toBe('Billing settings');
    });

    it('names the tablist by aria-labelledby, and passes other props to the root', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <>
          <h2 id="heading">Preferences</h2>
          <Tabs
            ref={ref}
            items={ITEMS}
            value="account"
            onChange={() => {}}
            aria-labelledby="heading"
            data-testid="root"
            id="t"
          />
        </>,
      );
      expect(screen.getByRole('tablist', { name: 'Preferences' })).toBeTruthy();
      expect(ref.current?.dataset.testid).toBe('root');
      expect(tab('Account').id).toBe('t-tab-0');
    });

    it('shows an icon, hidden from assistive tech, and keeps the label as the name', () => {
      renderTabs();
      expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).toBeTruthy();
      expect(tab('Security')).toBeTruthy();
    });

    it('renders nothing for the panel when there are no tabs', () => {
      renderTabs({ items: [] });
      expect(screen.queryByRole('tabpanel')).toBeNull();
    });

    it('reports its orientation', () => {
      renderTabs({ orientation: 'vertical' });
      expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical');
    });
  });

  describe('isSticky', () => {
    // The sticking itself is CSS, which jsdom doesn't lay out: this checks that it is switched on
    it('is off unless asked for', () => {
      renderTabs({ 'data-testid': 'root' } as Partial<TabsProps>);
      expect(screen.getByTestId('root').classList.contains(styles.sticky!)).toBe(false);
    });

    it('switches the sticky list on, and keeps the caller class', () => {
      renderTabs({
        isSticky: true,
        className: 'mine',
        'data-testid': 'root',
      } as Partial<TabsProps>);
      const root = screen.getByTestId('root');
      expect(root.classList.contains(styles.sticky!)).toBe(true);
      expect(root.classList.contains('mine')).toBe(true);
    });
  });

  describe('thumb', () => {
    // jsdom has no layout, so give each tab a box: Billing is the second, 100 wide
    const boxes: Record<string, { left: number; top: number; width: number; height: number }> = {
      Account: { left: 0, top: 0, width: 100, height: 40 },
      Billing: { left: 104, top: 0, width: 100, height: 40 },
    };
    const stub = (key: 'left' | 'top' | 'width' | 'height', prop: string) =>
      vi.spyOn(HTMLElement.prototype, prop as 'offsetLeft', 'get').mockImplementation(function (
        this: HTMLElement,
      ) {
        return boxes[this.textContent ?? '']?.[key] ?? 0;
      });
    const thumb = () =>
      screen.getByRole('tablist').querySelector('[aria-hidden="true"]') as HTMLElement;

    afterEach(() => vi.restoreAllMocks());

    it('is a decorative element in the list, placed on the selected tab', () => {
      stub('left', 'offsetLeft');
      stub('top', 'offsetTop');
      stub('width', 'offsetWidth');
      stub('height', 'offsetHeight');
      renderTabs();
      expect(thumb().getAttribute('role')).toBeNull();
      expect(thumb().style.width).toBe('100px');
      expect(thumb().style.height).toBe('40px');
      expect(thumb().style.transform).toBe('translate(0px, 0px)');
    });

    it('moves to the tab that is chosen', () => {
      stub('left', 'offsetLeft');
      stub('top', 'offsetTop');
      stub('width', 'offsetWidth');
      stub('height', 'offsetHeight');
      renderTabs();
      fireEvent.click(tab('Billing'));
      expect(thumb().style.transform).toBe('translate(104px, 0px)');
    });

    it('is not an accessible tab', () => {
      renderTabs();
      expect(screen.getAllByRole('tab')).toHaveLength(ITEMS.length);
    });

    it('is absent when there is no tab to sit behind', () => {
      renderTabs({ items: [] });
      expect(screen.getByRole('tablist').querySelector('[aria-hidden="true"]')).toBeNull();
    });
  });

  describe('selecting', () => {
    it('selects a tab on click and calls onChange', () => {
      const onChange = vi.fn();
      renderTabs({ onChange });
      fireEvent.click(tab('Billing'));
      expect(panel().textContent).toBe('Billing settings');
      expect(onChange).toHaveBeenCalledWith('billing');
    });

    it('does not call onChange for the tab that is already selected', () => {
      const onChange = vi.fn();
      renderTabs({ onChange });
      fireEvent.click(tab('Account'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not select a disabled tab', () => {
      const onChange = vi.fn();
      renderTabs({ onChange });
      expect(tab('Team').hasAttribute('disabled')).toBe(true);
      fireEvent.click(tab('Team'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('is controlled by value: it changes only when the caller changes it', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <Tabs items={ITEMS} aria-label="Settings" value="account" onChange={onChange} />,
      );
      fireEvent.click(tab('Billing'));
      expect(onChange).toHaveBeenCalledWith('billing');
      expect(panel().textContent).toBe('Account settings');
      rerender(<Tabs items={ITEMS} aria-label="Settings" value="billing" onChange={onChange} />);
      expect(panel().textContent).toBe('Billing settings');
    });

    it('mounts only the selected panel, and remounts it on each change', () => {
      const Counter = () => {
        const [n, setN] = useState(0);
        return <button onClick={() => setN(n + 1)}>count {n}</button>;
      };
      renderTabs({
        items: [
          { value: 'a', label: 'A', content: <Counter /> },
          { value: 'b', label: 'B', content: <p>B</p> },
        ],
      });
      fireEvent.click(screen.getByRole('button', { name: 'count 0' }));
      expect(screen.getByRole('button', { name: 'count 1' })).toBeTruthy();
      fireEvent.click(tab('B'));
      expect(screen.queryByRole('button', { name: /count/ })).toBeNull();
      fireEvent.click(tab('A'));
      expect(screen.getByRole('button', { name: 'count 0' })).toBeTruthy();
    });
  });

  describe('keyboard', () => {
    it('has the selected tab as the only tab stop', () => {
      renderTabs({ value: 'billing' });
      expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([-1, 0, -1, -1]);
    });

    it('moves the tab stop to the first enabled tab when the selected one is disabled', () => {
      renderTabs({ value: 'team' });
      expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
    });

    it('moves focus and selection together with → and ←, skipping disabled tabs', () => {
      const onChange = vi.fn();
      renderTabs({ onChange });
      tab('Account').focus();
      keyOn(tab('Account'), 'ArrowRight');
      expect(document.activeElement).toBe(tab('Billing'));
      expect(panel().textContent).toBe('Billing settings');
      keyOn(tab('Billing'), 'ArrowRight');
      expect(document.activeElement).toBe(tab('Security'));
      expect(onChange).toHaveBeenLastCalledWith('security');
      keyOn(tab('Security'), 'ArrowLeft');
      expect(document.activeElement).toBe(tab('Billing'));
    });

    it('wraps around at the ends', () => {
      renderTabs();
      tab('Account').focus();
      keyOn(tab('Account'), 'ArrowLeft');
      expect(document.activeElement).toBe(tab('Security'));
      keyOn(tab('Security'), 'ArrowRight');
      expect(document.activeElement).toBe(tab('Account'));
    });

    it('goes to the first and last enabled tab with Home and End', () => {
      renderTabs({ value: 'billing' });
      tab('Billing').focus();
      keyOn(tab('Billing'), 'End');
      expect(document.activeElement).toBe(tab('Security'));
      keyOn(tab('Security'), 'Home');
      expect(document.activeElement).toBe(tab('Account'));
    });

    it('uses ↑ and ↓ when vertical, and leaves ← and → alone', () => {
      renderTabs({ orientation: 'vertical' });
      tab('Account').focus();
      keyOn(tab('Account'), 'ArrowRight');
      expect(document.activeElement).toBe(tab('Account'));
      keyOn(tab('Account'), 'ArrowDown');
      expect(document.activeElement).toBe(tab('Billing'));
      keyOn(tab('Billing'), 'ArrowUp');
      expect(document.activeElement).toBe(tab('Account'));
    });

    it('uses ↑ and ↓ for nothing when horizontal', () => {
      renderTabs();
      tab('Account').focus();
      keyOn(tab('Account'), 'ArrowDown');
      expect(document.activeElement).toBe(tab('Account'));
    });

    it('mirrors ← and → in a right-to-left list', () => {
      renderTabs({ style: { direction: 'rtl' } });
      const list = screen.getByRole('tablist');
      list.style.direction = 'rtl';
      tab('Account').focus();
      keyOn(tab('Account'), 'ArrowLeft');
      expect(document.activeElement).toBe(tab('Billing'));
    });

    it('ignores arrow keys with a modifier, and prevents the default of the ones it handles', () => {
      renderTabs();
      tab('Account').focus();
      keyOn(tab('Account'), 'ArrowRight', { altKey: true });
      expect(document.activeElement).toBe(tab('Account'));
      expect(keyOn(tab('Account'), 'ArrowRight')).toBe(false);
    });

    it('stays put when it is the only tab that can be chosen', () => {
      renderTabs({ items: [ITEMS[0]!, ITEMS[2]!] });
      tab('Account').focus();
      keyOn(tab('Account'), 'ArrowRight');
      expect(document.activeElement).toBe(tab('Account'));
    });

    it('makes the panel reachable by Tab', () => {
      renderTabs();
      expect(panel().tabIndex).toBe(0);
    });
  });
});
