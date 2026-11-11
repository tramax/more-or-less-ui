import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { showCode, withoutActions } from '../../../.storybook/snippet';
import { Button } from '../Button';
import { Pagination } from '../Pagination';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Table, TABLE_DEFAULTS, type TableColumn, type TableSort } from './Table';

type Person = { id: string; name: string; role: string; team: string; age: number };

const PEOPLE: Person[] = [
  { id: '1', name: 'Ada Lovelace', role: 'Analyst', team: 'Engines', age: 36 },
  { id: '2', name: 'Grace Hopper', role: 'Rear admiral', team: 'Compilers', age: 85 },
  { id: '3', name: 'Linus Torvalds', role: 'Maintainer', team: 'Kernel', age: 55 },
  { id: '4', name: 'Margaret Hamilton', role: 'Director', team: 'Apollo', age: 88 },
  { id: '5', name: 'Alan Turing', role: 'Mathematician', team: 'Bletchley', age: 41 },
  { id: '6', name: 'Barbara Liskov', role: 'Professor', team: 'CLU', age: 85 },
  { id: '7', name: 'Dennis Ritchie', role: 'Engineer', team: 'Unix', age: 70 },
  { id: '8', name: 'Edsger Dijkstra', role: 'Professor', team: 'THE', age: 72 },
  { id: '9', name: 'Frances Allen', role: 'Fellow', team: 'Compilers', age: 88 },
  { id: '10', name: 'Donald Knuth', role: 'Professor', team: 'TeX', age: 87 },
  { id: '11', name: 'Radia Perlman', role: 'Fellow', team: 'Networks', age: 73 },
  { id: '12', name: 'Ken Thompson', role: 'Engineer', team: 'Unix', age: 82 },
];

// No `key`: a column only needs one to be sortable, and `cell` is what reads the row
const COLUMNS: TableColumn<Person>[] = [
  { header: 'Name', cell: (p) => p.name, isRowHeader: true },
  { header: 'Role', cell: (p) => p.role },
  { header: 'Team', cell: (p) => p.team },
  { header: 'Age', cell: (p) => p.age, align: 'end' },
];

// `key` is what `sort` refers to; here it is the Person field `sortRows` sorts by
const SORTABLE_COLUMNS: TableColumn<Person>[] = [
  { key: 'name', header: 'Name', cell: (p) => p.name, isRowHeader: true, isSortable: true },
  { key: 'role', header: 'Role', cell: (p) => p.role, isSortable: true },
  { key: 'team', header: 'Team', cell: (p) => p.team, isSortable: true },
  { key: 'age', header: 'Age', cell: (p) => p.age, align: 'end', isSortable: true },
];

const getRowKey = (person: Person) => person.id;

/** The parent sorts: the table shows the arrow and says which header was pressed. */
function sortRows(rows: Person[], sort: TableSort | null) {
  if (!sort) return rows;
  const key = sort.key as keyof Person;
  const sign = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const [x, y] = [a[key], b[key]];
    return (
      (typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y))) * sign
    );
  });
}

const meta: Meta<typeof Table<Person>> = {
  title: 'Display/Table',
  component: Table,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: {
    ...TABLE_DEFAULTS,
    caption: 'People',
    columns: COLUMNS,
    rows: PEOPLE.slice(0, 5),
    getRowKey,
  },
  parameters: {
    docs: { source: { transform: withoutActions } },
  },
  argTypes: {
    // Storybook only reads defaults from destructuring, so state them for the Default column
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: TABLE_DEFAULTS.size } },
    },
    columns: { control: false },
    rows: { control: false },
    getRowKey: { control: false },
  },
};
export default meta;
type Story = StoryObj<typeof Table<Person>>;

// Storybook prints a function in the args as `() => {}`, which hides what `cell` is for. Stories whose
// args hold columns write their snippet out instead (`showCode`), so the docs show a real column.
const COLUMNS_SNIPPET = `const columns: TableColumn<Person>[] = [
  // isRowHeader: this cell names the row, so it is a <th scope="row"> (heavier, read first by a screen reader)
  { header: 'Name', cell: (person) => person.name, isRowHeader: true },
  { header: 'Role', cell: (person) => person.role },
  { header: 'Team', cell: (person) => person.team },
  { header: 'Age', cell: (person) => person.age, align: 'end' },
];`;

/** The first column has `isRowHeader`: its cells name the row (`<th scope="row">`), so they are heavier than the others. */
export const Default: Story = {
  parameters: showCode(
    `${COLUMNS_SNIPPET}

<Table
  caption="People"
  columns={columns}
  rows={people}
  getRowKey={(person) => person.id}
/>`,
    { hasControls: true },
  ),
};

/** `sort` and `onSortChange` are the parent's: it sorts the rows (or asks the server to), the table only draws the arrow. */
export const Sorting: Story = {
  parameters:
    showCode(`// A sortable column needs a key: \`sort.key\` is the key of the sorted column
const columns: TableColumn<Person>[] = [
  { key: 'name', header: 'Name', cell: (person) => person.name, isRowHeader: true, isSortable: true },
  { key: 'age', header: 'Age', cell: (person) => person.age, align: 'end', isSortable: true },
];

const [sort, setSort] = useState<TableSort | null>(null);

<Table
  caption="People"
  columns={columns}
  rows={sortRows(people, sort)}
  getRowKey={(person) => person.id}
  sort={sort}
  onSortChange={setSort}
/>`),
  render: function Render() {
    const [sort, setSort] = useState<TableSort | null>({ key: 'age', direction: 'descending' });
    return (
      <Table
        caption="People"
        columns={SORTABLE_COLUMNS}
        rows={sortRows(PEOPLE.slice(0, 6), sort)}
        getRowKey={getRowKey}
        sort={sort}
        onSortChange={setSort}
      />
    );
  },
};

/** `selectedKeys` is the parent's: it feeds a toolbar of actions. The header box selects the rows shown. */
export const Selection: Story = {
  parameters: showCode(`const [selected, setSelected] = useState<string[]>([]);

<Table
  caption="People"
  columns={columns}
  rows={people}
  getRowKey={(person) => person.id}
  selectedKeys={selected}
  onSelectedKeysChange={setSelected}
/>`),
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['2', '4']);
    return (
      <Stack>
        <Table
          caption="People"
          columns={COLUMNS}
          rows={PEOPLE.slice(0, 6)}
          getRowKey={getRowKey}
          selectedKeys={selected}
          onSelectedKeysChange={setSelected}
        />
        <Text color="less">{selected.length} selected</Text>
      </Stack>
    );
  },
};

/**
 * The table does not page: pass it one page of rows and put a Pagination under it. A key that is not on
 * the page (here, a row picked on another page) stays selected.
 */
export const Paged: Story = {
  parameters: showCode(`<Stack>
  <Table
    caption="People"
    columns={columns}
    rows={people.slice((page - 1) * 5, page * 5)}
    getRowKey={(person) => person.id}
    sort={sort}
    onSortChange={setSort}
    selectedKeys={selected}
    onSelectedKeysChange={setSelected}
  />
  <Pagination page={page} pageCount={3} onChange={setPage} aria-label="People pages" />
</Stack>`),
  render: function Render() {
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<TableSort | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <Stack>
        <Table
          caption="People"
          columns={SORTABLE_COLUMNS}
          rows={sortRows(PEOPLE, sort).slice((page - 1) * 5, page * 5)}
          getRowKey={getRowKey}
          sort={sort}
          onSortChange={setSort}
          selectedKeys={selected}
          onSelectedKeysChange={setSelected}
        />
        <Pagination page={page} pageCount={3} onChange={setPage} aria-label="People pages" />
        <Text color="less">{selected.length} selected across all pages</Text>
      </Stack>
    );
  },
};

/** `align` is logical (`start` is the right in a right-to-left layout), and `width` is a CSS length. */
export const Columns: Story = {
  parameters: showCode(`const columns: TableColumn<Person>[] = [
  { header: 'Name', cell: (person) => person.name, isRowHeader: true, width: '40%' },
  { header: 'Team', cell: (person) => person.team, align: 'center' },
  { header: 'Age', cell: (person) => person.age, align: 'end', width: 100 },
];`),
  args: {
    columns: [
      { header: 'Name', cell: (p: Person) => p.name, isRowHeader: true, width: '40%' },
      { header: 'Team', cell: (p: Person) => p.team, align: 'center' },
      { header: 'Age', cell: (p: Person) => p.age, align: 'end', width: 100 },
    ],
  },
};

/** The cell is anything: `cell` returns a node. */
export const RichCells: Story = {
  parameters: showCode(`const columns: TableColumn<Person>[] = [
  {
    header: 'Person',
    isRowHeader: true,
    cell: (person) => (
      <Stack gap="less">
        <Text fontWeight="more">{person.name}</Text>
        <Text color="less" size="less">{person.role}</Text>
      </Stack>
    ),
  },
  { header: 'Team', cell: (person) => person.team },
  {
    header: <span>Action</span>,
    align: 'end',
    cell: (person) => (
      <Button size="less" aria-label={\`Message \${person.name}\`}>Message</Button>
    ),
  },
];`),
  args: {
    columns: [
      {
        header: 'Person',
        isRowHeader: true,
        cell: (p: Person) => (
          <Stack gap="less">
            <Text fontWeight="more">{p.name}</Text>
            <Text color="less" size="less">
              {p.role}
            </Text>
          </Stack>
        ),
      },
      { header: 'Team', cell: (p: Person) => p.team },
      {
        header: <span>Action</span>,
        align: 'end',
        cell: (p: Person) => (
          <Button size="less" aria-label={`Message ${p.name}`}>
            Message
          </Button>
        ),
      },
    ],
  },
};

/** No rows: the message takes a row of its own. Left out, an empty table is only its header. */
export const Empty: Story = {
  parameters: showCode(`<Table
  caption="People"
  columns={columns}
  rows={[]}
  getRowKey={(person) => person.id}
  emptyMessage="No people match your search."
/>`),
  args: { rows: [], emptyMessage: 'No people match your search.' },
};

/**
 * Loading is `aria-busy` on the table, or on something around it: every cell becomes a block as long as
 * its content. Render a few rows of neutral text of about the right length to give it a shape.
 */
export const Loading: Story = {
  parameters: showCode(`<Table
  aria-busy={isLoading}
  caption="People"
  columns={columns}
  rows={isLoading ? placeholderRows : people}
  getRowKey={(person) => person.id}
/>`),
  render: function Render() {
    const [isLoading, setIsLoading] = useState(true);
    const placeholderRows: Person[] = Array.from({ length: 4 }, (_, i) => ({
      id: `loading-${i}`,
      name: 'Placeholder name',
      role: 'Placeholder role',
      team: 'Placeholder',
      age: 99,
    }));
    return (
      <Stack>
        <Table
          aria-busy={isLoading}
          caption="People"
          columns={COLUMNS}
          rows={isLoading ? placeholderRows : PEOPLE.slice(0, 4)}
          getRowKey={getRowKey}
        />
        <div>
          <Button onClick={() => setIsLoading((value) => !value)}>
            {isLoading ? 'Finish loading' : 'Load again'}
          </Button>
        </div>
      </Stack>
    );
  },
};

export const Size: Story = {
  parameters: showCode(
    (['less', 'normal', 'more'] as const)
      .map(
        (v) =>
          `<Table size="${v}" caption="People" columns={columns} rows={people} getRowKey={…} />`,
      )
      .join('\n'),
  ),
  render: () => (
    <Stack>
      {(['less', 'normal', 'more'] as const).map((v) => (
        <Table
          key={v}
          size={v}
          caption={`size="${v}"`}
          columns={COLUMNS}
          rows={PEOPLE.slice(0, 3)}
          getRowKey={getRowKey}
        />
      ))}
    </Stack>
  ),
};
