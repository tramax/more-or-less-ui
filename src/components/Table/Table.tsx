import {
  forwardRef,
  useId,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
  type TableHTMLAttributes,
} from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps, toCssValue } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import { CheckControl } from '../_shared/CheckControl';
import { ChevronIcon } from '../_shared/ChevronIcon';
import placeholder from '../_shared/Placeholder.module.css';
import sizes from '../_shared/Size.module.css';
import styles from './Table.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const TABLE_DEFAULTS = {
  size: 'normal',
} as const;

// `size` sets font-size only: the padding and the gaps are in em (see Table.module.css), so they follow
// it, escape-hatch values included. Its classes are _shared/Size.module.css, since `size` is the only
// scale prop.
const SCALE_SPEC = {
  // Empty, so the direct props are inferred as none rather than as any string
  direct: [],
  compound: { size: ['fontSize'] },
  defaults: TABLE_DEFAULTS,
} as const;

export type TableColumn<Row> = {
  /** The column's name, in the header. */
  header: ReactNode;
  /**
   * What the cell of a row shows. The table never reads the row by itself: whatever `cell` returns is
   * the cell, so `cell: (person) => person.name` is how a column gets its data.
   */
  cell: (row: Row) => ReactNode;
  /** Where the text sits in the column. Logical, so `start` is the right in a right-to-left layout. Default `start`. */
  align?: 'start' | 'center' | 'end';
  /** The column's width: a CSS length (a number is pixels). Left out, the browser shares the room. */
  width?: string | number;
  /**
   * The cells of this column name their row (a `<th scope="row">`, not a `<td>`): the name of a person,
   * an order number. A screen reader reads it with each of the row's other cells, and it names the
   * row's checkbox. Usually one column.
   */
  isRowHeader?: boolean;
} & (
  | {
      /**
       * The header is a button that asks for this column to be sorted. Only has an effect when the
       * table has `sort` and `onSortChange`: the table does not sort, the parent does.
       */
      isSortable: true;
      /**
       * An id for the column: it is not a field of the row and the table never reads the row with it.
       * `sort.key` is the `key` of the sorted column, and `onSortChange` gives the `key` of the one
       * pressed; what it means for the rows (a field, a server column) is the parent's. Unique within
       * the table. Required here, because a sortable column has to be told apart from the others.
       */
      key: string;
    }
  | {
      isSortable?: false;
      /** The column's id, as for a sortable column. Left out, the column is named by its position. */
      key?: string;
    }
);

export type TableSort = {
  /** The `key` of the column the rows are sorted by. */
  key: string;
  direction: 'ascending' | 'descending';
};

/** The names of the checkboxes, for another language. Each one you leave out is the English default. */
export type TableLabels = {
  /** The header checkbox's name. Default `Select all rows`. */
  selectAll?: string;
  /**
   * A row's checkbox's name, when the table has no row header column to name it by (with one, the
   * checkbox is named by the row's header). Default `Select row`.
   */
  selectRow?: string;
};

const DEFAULT_LABELS = {
  selectAll: 'Select all rows',
  selectRow: 'Select row',
} satisfies Required<TableLabels>;

export type TableProps<Row> = Omit<TableHTMLAttributes<HTMLTableElement>, 'children' | 'color'> & {
  /** The columns, in order. */
  columns: TableColumn<Row>[];
  /** The rows to show, in the order to show them. Paging and sorting are the parent's: pass this page, already sorted. */
  rows: Row[];
  /** A string that identifies a row and stays the same when the rows are reordered, reloaded or paged (an id). */
  getRowKey: (row: Row) => string;
  /** Shown in a row of its own when there are no rows. Left out, an empty table is only its header. */
  emptyMessage?: ReactNode;
  /** Sets the font size; the padding and the gaps follow it. `1em` takes the surrounding text's size. */
  size?: ScaleProp;
  /** The names of the checkboxes, for another language. */
  labels?: TableLabels;
} & (
    | {
        /** The table's visible name, above it. Without it, pass `aria-label` (a name only a screen reader gets) or `aria-labelledby`. */
        caption: string;
      }
    | { caption?: undefined; 'aria-label': string }
    | { caption?: undefined; 'aria-labelledby': string }
  ) &
  (
    | { sort?: undefined; onSortChange?: undefined }
    | {
        /**
         * How the rows are sorted now, or `null` for the order they came in. Always controlled: the
         * parent owns it and sorts `rows` (a server may do it). The table only shows the arrow and
         * reports the press.
         */
        sort: TableSort | null;
        /**
         * Called when a sortable header is pressed: the first press on a column asks for `ascending`, the
         * next for `descending`, then it goes back and forth.
         */
        onSortChange: (sort: TableSort) => void;
      }
  ) &
  (
    | { selectedKeys?: undefined; onSelectedKeysChange?: undefined }
    | {
        /**
         * The `getRowKey` of every selected row; it adds a checkbox to each row, and one in the header
         * that selects the rows shown. Always controlled: what is selected is the parent's (it feeds a
         * toolbar of actions). A key that is not in `rows` (another page) is kept as it is.
         */
        selectedKeys: string[];
        /**
         * Called with the whole selection after a change: the keys not shown, then the shown rows that
         * are selected, in the order of `rows`.
         */
        onSelectedKeysChange: (keys: string[]) => void;
      }
  );

const ALIGN_CLASS = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
} as const;

function TableInner<Row>(
  {
    columns,
    rows,
    getRowKey,
    caption,
    emptyMessage,
    sort,
    onSortChange,
    selectedKeys,
    onSelectedKeysChange,
    labels,
    size,
    className,
    style,
    ...props
  }: TableProps<Row>,
  ref: ForwardedRef<HTMLTableElement>,
) {
  const id = useId();
  const {
    classNames,
    style: scaleStyle,
    rest,
  } = resolveScaleProps(sizes, SCALE_SPEC, { ...props, size });
  const text = { ...DEFAULT_LABELS, ...labels };

  const isSelectable = selectedKeys !== undefined && onSelectedKeysChange !== undefined;
  const rowKeys = rows.map(getRowKey);
  const selected = new Set(selectedKeys);
  const selectedCount = rowKeys.filter((key) => selected.has(key)).length;
  const areAllSelected = rows.length > 0 && selectedCount === rows.length;

  // The selection after a change to the shown rows: what is not shown stays, in the order it had
  const select = (shown: Set<string>) => {
    if (selectedKeys === undefined || onSelectedKeysChange === undefined) return;
    const rowKeySet = new Set(rowKeys);
    onSelectedKeysChange([
      ...selectedKeys.filter((key) => !rowKeySet.has(key)),
      ...rowKeys.filter((key) => shown.has(key)),
    ]);
  };
  const toggleAll = () => select(areAllSelected ? new Set() : new Set(rowKeys));
  const toggleRow = (key: string) => {
    const shown = new Set(rowKeys.filter((rowKey) => selected.has(rowKey)));
    if (!shown.delete(key)) shown.add(key);
    select(shown);
  };

  const isSortingOn = sort !== undefined && onSortChange !== undefined;
  // Only a sortable column has a button, and the type gives it a key
  const press = (key: string | undefined) => {
    if (!isSortingOn || key === undefined) return;
    const isAscending = sort?.key === key && sort.direction === 'ascending';
    onSortChange({ key, direction: isAscending ? 'descending' : 'ascending' });
  };

  // A column without a key is named by its position, for React
  const columnKey = (column: TableColumn<Row>, index: number) => column.key ?? `#${index}`;

  const rowHeaderIndex = columns.findIndex((column) => column.isRowHeader);
  const columnCount = columns.length + (isSelectable ? 1 : 0);

  return (
    <table
      {...rest}
      ref={ref}
      className={clsx(styles.root, classNames, className)}
      style={{ ...scaleStyle, ...style }}
    >
      {caption !== undefined && <caption className={styles.caption}>{caption}</caption>}
      <thead>
        <tr>
          {isSelectable && (
            <th scope="col" className={styles.selectCell}>
              <CheckControl
                controlClassName={styles.select}
                checked={areAllSelected}
                isIndeterminate={selectedCount > 0 && !areAllSelected}
                disabled={rows.length === 0}
                aria-label={text.selectAll}
                onChange={toggleAll}
              />
            </th>
          )}
          {columns.map((column, columnIndex) => {
            const isSorted = isSortingOn && column.key !== undefined && sort?.key === column.key;
            const isSortable = isSortingOn && column.isSortable === true;
            return (
              <th
                key={columnKey(column, columnIndex)}
                scope="col"
                aria-sort={isSortable ? (isSorted ? sort.direction : 'none') : undefined}
                className={ALIGN_CLASS[column.align ?? 'start']}
                style={
                  column.width === undefined ? undefined : { inlineSize: toCssValue(column.width) }
                }
              >
                {isSortable ? (
                  <button type="button" className={styles.sort} onClick={() => press(column.key)}>
                    {column.header}
                    <ChevronIcon
                      className={clsx(
                        styles.arrow,
                        isSorted && styles.sorted,
                        isSorted && sort.direction === 'ascending' && styles.ascending,
                      )}
                    />
                  </button>
                ) : (
                  column.header
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && emptyMessage !== undefined && (
          <tr>
            <td colSpan={columnCount} className={styles.empty}>
              {emptyMessage}
            </td>
          </tr>
        )}
        {rows.map((row, rowIndex) => {
          const key = rowKeys[rowIndex] as string;
          const isRowSelected = selected.has(key);
          const rowHeaderId = rowHeaderIndex === -1 ? undefined : `${id}-row-${rowIndex}`;
          return (
            <tr key={key} className={clsx(isRowSelected && isSelectable && styles.selected)}>
              {isSelectable && (
                <td className={styles.selectCell}>
                  <CheckControl
                    controlClassName={styles.select}
                    checked={isRowSelected}
                    aria-labelledby={rowHeaderId}
                    aria-label={rowHeaderId === undefined ? text.selectRow : undefined}
                    onChange={() => toggleRow(key)}
                  />
                </td>
              )}
              {columns.map((column, columnIndex) => {
                const Cell = column.isRowHeader ? 'th' : 'td';
                return (
                  <Cell
                    key={columnKey(column, columnIndex)}
                    id={columnIndex === rowHeaderIndex ? rowHeaderId : undefined}
                    scope={column.isRowHeader ? 'row' : undefined}
                    className={ALIGN_CLASS[column.align ?? 'start']}
                  >
                    {/* Inside aria-busy, the content becomes a block as long as it is (Placeholder) */}
                    <span className={placeholder.placeholder}>{column.cell(row)}</span>
                  </Cell>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * Rows of data in columns, for comparing and looking things up: orders, people, files. For a handful of
 * label-and-value pairs use a list; for cards of unlike content use Grid. It is a native `<table>`, so
 * screen readers announce the row and column of every cell; do not use it for layout.
 *
 * Data-driven: `columns` say what to show and `rows` are the data. The table holds no state. It does not
 * sort or page: the parent passes the rows to show (a Pagination under it pages them), and `sort` and
 * `selectedKeys` are the parent's too, since what they pick decides what the rest of the screen shows.
 *
 * Loading is `aria-busy="true"` on the table or on something around it: every cell becomes a block as
 * long as its content. Render a few rows of neutral text to give it a shape.
 */
export const Table = forwardRef(TableInner) as <Row>(
  props: TableProps<Row> & RefAttributes<HTMLTableElement>,
) => ReactElement | null;
