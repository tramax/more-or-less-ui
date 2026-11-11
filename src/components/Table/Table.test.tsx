import { createRef, useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import sizes from '../_shared/Size.module.css';
import placeholder from '../_shared/Placeholder.module.css';
import { Table, type TableColumn, type TableProps, type TableSort } from './Table';

afterEach(cleanup);

type Person = { id: string; name: string; role: string; age: number };

const PEOPLE: Person[] = [
  { id: 'a', name: 'Ada', role: 'Engineer', age: 36 },
  { id: 'b', name: 'Grace', role: 'Admiral', age: 85 },
  { id: 'c', name: 'Linus', role: 'Maintainer', age: 55 },
];

const COLUMNS: TableColumn<Person>[] = [
  { key: 'name', header: 'Name', cell: (p) => p.name, isRowHeader: true, isSortable: true },
  { key: 'role', header: 'Role', cell: (p) => p.role },
  { key: 'age', header: 'Age', cell: (p) => p.age, align: 'end', isSortable: true, width: 80 },
];

const getRowKey = (p: Person) => p.id;

type Props = Partial<TableProps<Person>>;
const renderTable = (props: Props = {}) =>
  render(
    <Table<Person>
      caption="People"
      columns={COLUMNS}
      rows={PEOPLE}
      getRowKey={getRowKey}
      {...(props as object)}
    />,
  );

const table = () => screen.getByRole('table');
const header = (name: string) => screen.getByRole('columnheader', { name });
/** The text of each body row's cells, e.g. ['Ada', 'Engineer', '36']. */
const bodyRows = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((tr) => [...tr.querySelectorAll('th, td')].map((cell) => cell.textContent));

describe('Table', () => {
  describe('structure', () => {
    it('is a native table named by its caption, with a header row and a row per item', () => {
      renderTable();
      expect(table().tagName).toBe('TABLE');
      expect(screen.getByRole('table', { name: 'People' })).toBeTruthy();
      expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
        'Name',
        'Role',
        'Age',
      ]);
      expect(bodyRows()).toEqual([
        ['Ada', 'Engineer', '36'],
        ['Grace', 'Admiral', '85'],
        ['Linus', 'Maintainer', '55'],
      ]);
    });

    it('can be named by aria-label or aria-labelledby instead of a caption', () => {
      render(<Table columns={COLUMNS} rows={PEOPLE} getRowKey={getRowKey} aria-label="Staff" />);
      expect(screen.getByRole('table', { name: 'Staff' })).toBeTruthy();
      expect(table().querySelector('caption')).toBeNull();
      cleanup();
      render(
        <>
          <h2 id="t">Team</h2>
          <Table columns={COLUMNS} rows={PEOPLE} getRowKey={getRowKey} aria-labelledby="t" />
        </>,
      );
      expect(screen.getByRole('table', { name: 'Team' })).toBeTruthy();
    });

    it('makes the cells of a row header column <th scope="row">', () => {
      renderTable();
      const first = screen.getAllByRole('row')[1] as HTMLElement;
      const name = within(first).getByRole('rowheader', { name: 'Ada' });
      expect(name.tagName).toBe('TH');
      expect(name.getAttribute('scope')).toBe('row');
      expect(
        within(first)
          .getAllByRole('cell')
          .map((c) => c.textContent),
      ).toEqual(['Engineer', '36']);
    });

    it('sets scope="col" on the headers', () => {
      renderTable();
      for (const th of screen.getAllByRole('columnheader')) {
        expect(th.getAttribute('scope')).toBe('col');
      }
    });

    it('aligns a column and gives it a width', () => {
      renderTable();
      const age = header('Age');
      expect(age.className).toContain('alignEnd');
      expect(age.style.inlineSize).toBe('80px');
      expect(header('Name').className).toContain('alignStart');
      expect(header('Name').style.inlineSize).toBe('');
      const cell = screen.getAllByRole('row')[1]?.querySelectorAll('td')[1] as HTMLElement;
      expect(cell.className).toContain('alignEnd');
    });

    it('passes other props and the ref to the table', () => {
      const ref = createRef<HTMLTableElement>();
      render(
        <Table<Person>
          ref={ref}
          caption="People"
          columns={COLUMNS}
          rows={PEOPLE}
          getRowKey={getRowKey}
          id="people"
          className="mine"
          style={{ color: 'red' }}
        />,
      );
      expect(ref.current).toBe(table());
      expect(table().id).toBe('people');
      expect(table().classList.contains('mine')).toBe(true);
      expect(table().style.color).toBe('red');
    });

    it('sets the font size from `size`, normal by default', () => {
      renderTable();
      expect(table().classList.contains(sizes.sizeNormal as string)).toBe(true);
      cleanup();
      renderTable({ size: 'more' });
      expect(table().classList.contains(sizes.sizeMore as string)).toBe(true);
      cleanup();
      renderTable({ size: '1em' });
      expect(table().style.fontSize).toBe('1em');
    });
  });

  describe('empty', () => {
    it('shows only the header when there are no rows and no message', () => {
      renderTable({ rows: [] });
      expect(screen.getAllByRole('row')).toHaveLength(1);
    });

    it('shows the message in a row that spans the columns', () => {
      renderTable({ rows: [], emptyMessage: 'No people yet' });
      const cell = screen.getByRole('cell', { name: 'No people yet' });
      expect(cell.getAttribute('colspan')).toBe('3');
    });

    it('spans the checkbox column too', () => {
      renderTable({
        rows: [],
        emptyMessage: 'Nobody',
        selectedKeys: [],
        onSelectedKeysChange: () => {},
      });
      expect(screen.getByRole('cell', { name: 'Nobody' }).getAttribute('colspan')).toBe('4');
    });

    it('does not show the message while there are rows', () => {
      renderTable({ emptyMessage: 'No people yet' });
      expect(screen.queryByText('No people yet')).toBeNull();
    });
  });

  describe('loading', () => {
    it('puts each cell’s content in a placeholder, which turns into a block inside aria-busy', () => {
      renderTable({ 'aria-busy': true });
      expect(table().getAttribute('aria-busy')).toBe('true');
      const block = screen.getByText('Engineer');
      expect(block.tagName).toBe('SPAN');
      expect(block.classList.contains(placeholder.placeholder as string)).toBe(true);
    });

    it('leaves the headers as they are', () => {
      renderTable({ 'aria-busy': true });
      expect(header('Role').querySelector(`.${placeholder.placeholder as string}`)).toBeNull();
    });
  });

  describe('sorting', () => {
    const sortable = (sort: TableSort | null) => {
      const onSortChange = vi.fn();
      renderTable({ sort, onSortChange });
      return onSortChange;
    };

    it('makes a sortable header a button, and leaves the others as text', () => {
      sortable(null);
      expect(within(header('Name')).getByRole('button', { name: 'Name' })).toBeTruthy();
      expect(within(header('Age')).getByRole('button', { name: 'Age' })).toBeTruthy();
      expect(within(header('Role')).queryByRole('button')).toBeNull();
    });

    it('marks aria-sort: none on unsorted sortable columns and the direction on the sorted one', () => {
      sortable({ key: 'age', direction: 'descending' });
      expect(header('Name').getAttribute('aria-sort')).toBe('none');
      expect(header('Age').getAttribute('aria-sort')).toBe('descending');
      expect(header('Role').hasAttribute('aria-sort')).toBe(false);
    });

    it('asks for ascending first, on a column that is not sorted', () => {
      const onSortChange = sortable({ key: 'age', direction: 'descending' });
      fireEvent.click(within(header('Name')).getByRole('button'));
      expect(onSortChange).toHaveBeenCalledWith({ key: 'name', direction: 'ascending' });
    });

    it('asks for descending on a column sorted ascending, and ascending on one sorted descending', () => {
      const onSortChange = sortable({ key: 'name', direction: 'ascending' });
      fireEvent.click(within(header('Name')).getByRole('button'));
      expect(onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'descending' });
      cleanup();
      const again = sortable({ key: 'name', direction: 'descending' });
      fireEvent.click(within(header('Name')).getByRole('button'));
      expect(again).toHaveBeenCalledWith({ key: 'name', direction: 'ascending' });
    });

    it('does not sort the rows itself: the parent does', () => {
      sortable({ key: 'age', direction: 'descending' });
      fireEvent.click(within(header('Name')).getByRole('button'));
      expect(bodyRows().map((r) => r[0])).toEqual(['Ada', 'Grace', 'Linus']);
    });

    it('turns the arrow up for ascending only', () => {
      sortable({ key: 'name', direction: 'ascending' });
      const arrow = (name: string) => header(name).querySelector('svg') as SVGElement;
      expect(arrow('Name').getAttribute('class')).toContain('ascending');
      expect(arrow('Name').getAttribute('class')).toContain('sorted');
      expect(arrow('Age').getAttribute('class')).not.toContain('sorted');
    });

    it('draws columns without a key, and never marks one as sorted', () => {
      renderTable({
        columns: [
          { header: 'Name', cell: (p: Person) => p.name, isRowHeader: true },
          { header: 'Role', cell: (p: Person) => p.role },
        ],
        sort: { key: 'name', direction: 'ascending' },
        onSortChange: vi.fn(),
      });
      expect(screen.queryByRole('button')).toBeNull();
      expect(header('Name').hasAttribute('aria-sort')).toBe(false);
      expect(bodyRows()[0]).toEqual(['Ada', 'Engineer']);
    });

    it('ignores isSortable without sort and onSortChange', () => {
      renderTable();
      expect(screen.queryByRole('button')).toBeNull();
      expect(header('Name').hasAttribute('aria-sort')).toBe(false);
    });

    it('works when the parent keeps the sort', () => {
      function Sorted() {
        const [sort, setSort] = useState<TableSort | null>(null);
        const rows = [...PEOPLE].sort((a, b) =>
          sort?.key === 'age' ? (a.age - b.age) * (sort.direction === 'ascending' ? 1 : -1) : 0,
        );
        return (
          <Table
            caption="People"
            columns={COLUMNS}
            rows={rows}
            getRowKey={getRowKey}
            sort={sort}
            onSortChange={setSort}
          />
        );
      }
      render(<Sorted />);
      const press = () => fireEvent.click(within(header('Age')).getByRole('button'));
      press();
      expect(bodyRows().map((r) => r[2])).toEqual(['36', '55', '85']);
      expect(header('Age').getAttribute('aria-sort')).toBe('ascending');
      press();
      expect(bodyRows().map((r) => r[2])).toEqual(['85', '55', '36']);
      expect(header('Age').getAttribute('aria-sort')).toBe('descending');
    });
  });

  describe('selection', () => {
    const selectable = (selectedKeys: string[], props: Props = {}) => {
      const onSelectedKeysChange = vi.fn();
      renderTable({ selectedKeys, onSelectedKeysChange, ...props });
      return onSelectedKeysChange;
    };
    const boxes = () => screen.getAllByRole('checkbox') as HTMLInputElement[];
    const all = () => screen.getByRole('checkbox', { name: 'Select all rows' }) as HTMLInputElement;

    it('adds no checkboxes without selectedKeys', () => {
      renderTable();
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });

    it('adds a checkbox to the header and to each row', () => {
      selectable([]);
      expect(boxes()).toHaveLength(4);
      expect(all().checked).toBe(false);
    });

    it('names a row’s checkbox by the row header', () => {
      selectable(['b']);
      expect(screen.getByRole('checkbox', { name: 'Grace' })).toHaveProperty('checked', true);
      expect(screen.getByRole('checkbox', { name: 'Ada' })).toHaveProperty('checked', false);
    });

    it('names it "Select row" when no column is a row header, or by `labels`', () => {
      selectable([], { columns: COLUMNS.map((c) => ({ ...c, isRowHeader: false })) });
      expect(screen.getAllByRole('checkbox', { name: 'Select row' })).toHaveLength(3);
      cleanup();
      selectable([], {
        columns: COLUMNS.map((c) => ({ ...c, isRowHeader: false })),
        labels: { selectAll: 'Tout', selectRow: 'Ligne' },
      });
      expect(screen.getAllByRole('checkbox', { name: 'Ligne' })).toHaveLength(3);
      expect(screen.getByRole('checkbox', { name: 'Tout' })).toBeTruthy();
    });

    it('selects a row, in the order of the rows', () => {
      const onChange = selectable(['c']);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Ada' }));
      expect(onChange).toHaveBeenCalledWith(['a', 'c']);
    });

    it('deselects a row', () => {
      const onChange = selectable(['a', 'c']);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Ada' }));
      expect(onChange).toHaveBeenCalledWith(['c']);
    });

    it('keeps a selected key that is not in the rows (another page), ahead of the shown ones', () => {
      const onChange = selectable(['elsewhere', 'a']);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Linus' }));
      expect(onChange).toHaveBeenCalledWith(['elsewhere', 'a', 'c']);
    });

    it('selects every shown row from the header, keeping the other keys', () => {
      const onChange = selectable(['elsewhere', 'b']);
      fireEvent.click(all());
      expect(onChange).toHaveBeenCalledWith(['elsewhere', 'a', 'b', 'c']);
    });

    it('deselects every shown row from the header when all are selected, keeping the other keys', () => {
      const onChange = selectable(['elsewhere', 'a', 'b', 'c']);
      expect(all().checked).toBe(true);
      fireEvent.click(all());
      expect(onChange).toHaveBeenCalledWith(['elsewhere']);
    });

    it('shows the header checkbox as indeterminate while some rows are selected', () => {
      selectable(['a']);
      expect(all().checked).toBe(false);
      expect(all().indeterminate).toBe(true);
      cleanup();
      selectable([]);
      expect(all().indeterminate).toBe(false);
      cleanup();
      selectable(['a', 'b', 'c']);
      expect(all().indeterminate).toBe(false);
    });

    it('does not count keys that are not shown toward the header checkbox', () => {
      selectable(['elsewhere']);
      expect(all().checked).toBe(false);
      expect(all().indeterminate).toBe(false);
    });

    it('disables the header checkbox when there are no rows', () => {
      selectable([], { rows: [] });
      expect(all().disabled).toBe(true);
    });

    it('marks the selected rows', () => {
      selectable(['b']);
      const rows = screen.getAllByRole('row').slice(1);
      expect(rows.map((r) => r.className.includes('selected'))).toEqual([false, true, false]);
    });

    it('works when the parent keeps the selection', () => {
      function Selected() {
        const [keys, setKeys] = useState<string[]>([]);
        return (
          <Table
            caption="People"
            columns={COLUMNS}
            rows={PEOPLE}
            getRowKey={getRowKey}
            selectedKeys={keys}
            onSelectedKeysChange={setKeys}
          />
        );
      }
      render(<Selected />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Grace' }));
      expect(screen.getByRole('checkbox', { name: 'Grace' })).toHaveProperty('checked', true);
      expect(all().indeterminate).toBe(true);
      fireEvent.click(all());
      expect(boxes().every((box) => box.checked)).toBe(true);
    });
  });
});
