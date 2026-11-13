import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Chip,
  Menu,
  Pagination,
  Stack,
  Table,
  Text,
  Title,
  useToast,
  type TableColumn,
  type TableSort,
} from 'more-or-less-ui';
import { BOOKINGS, formatDay, type Booking } from './data';

const PAGE_SIZE = 4;
const KINDS = ['Wheel throwing', 'Hand building', 'Glazing', 'Kids’ clay'];
const ROW_ACTIONS = [
  { value: 'calendar', label: 'Add to calendar' },
  { value: 'cancel', label: 'Cancel booking' },
];

/** The same bookings as a table you can filter, sort, page and select, as a real list would be. */
export function Bookings() {
  const toast = useToast();
  const [bookings, setBookings] = useState(BOOKINGS);
  const [kinds, setKinds] = useState<string[]>([]);
  const [sort, setSort] = useState<TableSort>({ key: 'date', direction: 'ascending' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(() => {
    const shown = bookings.filter((b) => kinds.length === 0 || kinds.includes(b.className));
    const sign = sort.direction === 'ascending' ? 1 : -1;
    return [...shown].sort((a, b) => {
      const [x, y] = sort.key === 'class' ? [a.className, b.className] : [a.date, b.date];
      return x < y ? -sign : x > y ? sign : 0;
    });
  }, [bookings, kinds, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cancel = (ids: string[]) => {
    setBookings((all) => all.filter((b) => !ids.includes(b.id)));
    setSelected((all) => all.filter((id) => !ids.includes(id)));
    setPage(1);
    toast.add({
      title: ids.length === 1 ? 'Booking cancelled' : `${ids.length} bookings cancelled`,
    });
  };

  const columns: TableColumn<Booking>[] = [
    {
      key: 'class',
      header: 'Class',
      isSortable: true,
      isRowHeader: true,
      cell: (b) => b.className,
    },
    { key: 'date', header: 'Date', isSortable: true, cell: (b) => formatDay(b.date) },
    { header: 'Status', cell: (b) => <Chip>{b.status}</Chip> },
    { header: 'Price', align: 'end', cell: (b) => `£${b.price}` },
    {
      header: 'Actions',
      align: 'end',
      cell: (b) => (
        <Menu
          trigger={
            <Button size="less" background="less" aria-label={`Actions for ${b.className}`}>
              Manage
            </Button>
          }
          items={ROW_ACTIONS}
          placement="bottom"
          align="end"
          onSelect={(value) => {
            if (value === 'cancel') cancel([b.id]);
            else toast.add({ title: 'Added to your calendar', description: formatDay(b.date) });
          }}
        />
      ),
    },
  ];

  return (
    <Card padding="more">
      <Stack gap="more">
        <Title as="h3">Your bookings</Title>

        <Stack direction="row" gap="less" align="center" wrap>
          {KINDS.map((kind) => (
            <Chip
              key={kind}
              isSelected={kinds.includes(kind)}
              onSelectedChange={(isOn) => {
                setKinds((all) => (isOn ? [...all, kind] : all.filter((k) => k !== kind)));
                setPage(1);
              }}
            >
              {kind}
            </Chip>
          ))}
        </Stack>

        <Table
          aria-label="Your bookings"
          columns={columns}
          rows={pageRows}
          getRowKey={(b) => b.id}
          sort={sort}
          onSortChange={setSort}
          selectedKeys={selected}
          onSelectedKeysChange={setSelected}
          emptyMessage="No bookings match. Clear a filter above."
        />

        <Stack direction="row" gap="more" align="center" justify="between" wrap>
          <Pagination
            page={page}
            pageCount={pageCount}
            onChange={setPage}
            aria-label="Pages of bookings"
          />
          <Stack direction="row" gap="normal" align="center" wrap>
            <Text size="less" color="less">
              {selected.length === 0
                ? 'Select rows to cancel several at once.'
                : `${selected.length} selected`}
            </Text>
            <Button
              background="less"
              isDisabled={selected.length === 0}
              onClick={() => cancel(selected)}
            >
              Cancel selected
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}
