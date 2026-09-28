import { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import styles from './EnrollmentTable.module.css';

interface EnrollmentTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  showPagination?: boolean;
  showTopPagination?: boolean;
  emptyMessage?: string;
  noScroll?: boolean; // kept for API compatibility, table is always non-scrolling
  isLoading?: boolean;
  skeletonRows?: number;
}

export function EnrollmentTable<T>({
  data,
  columns,
  pageSize = 10,
  onPageSizeChange,
  showPagination = true,
  showTopPagination = false,
  emptyMessage = 'No data found.',
  isLoading = false,
  skeletonRows = 8,
}: EnrollmentTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  });

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;
  const currentPageSize = table.getState().pagination.pageSize;
  const rowFrom = currentPage * currentPageSize + 1;
  const rowTo = Math.min((currentPage + 1) * currentPageSize, data.length);

  const paginationNode = (top = false) => (
    <div className={`${styles.pagination} ${top ? styles.paginationTop : ''}`}>
      <div className={styles.paginationLeft}>
        <label className={styles.pageSizeLabel}>
          Rows per page:
          <select
            className={styles.pageSizeSelect}
            value={currentPageSize}
            onChange={(e) => {
              const size = Number(e.target.value);
              table.setPageSize(size);
              onPageSizeChange?.(size);
            }}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.paginationInfo}>
          Showing {rowFrom}–{rowTo} of {data.length}
        </span>
      </div>
      <div className={styles.paginationControls}>
        <button
          className={styles.paginationBtn}
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
          title="First page"
        >
          «
        </button>
        <button
          className={styles.paginationBtn}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          title="Previous page"
        >
          ‹
        </button>
        {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
          let pageIdx = i;
          if (pageCount > 5) {
            const start = Math.max(0, Math.min(currentPage - 2, pageCount - 5));
            pageIdx = start + i;
          }
          return (
            <button
              key={pageIdx}
              className={`${styles.paginationBtn} ${pageIdx === currentPage ? styles.paginationBtnActive : ''}`}
              onClick={() => table.setPageIndex(pageIdx)}
            >
              {pageIdx + 1}
            </button>
          );
        })}
        <button
          className={styles.paginationBtn}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          title="Next page"
        >
          ›
        </button>
        <button
          className={styles.paginationBtn}
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
          title="Last page"
        >
          »
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.tableWrapper}>
      {showTopPagination && data.length > 0 && paginationNode(true)}

      <div className={styles.tableScrollArea}>
        <div className="table-responsive">
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className={styles.tableHeadRow}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`${styles.tableHeadCell} ${header.id === 'actions' || header.id === 'select' ? styles.tableHeadCellNoSort : ''}`}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                      title={
                        header.column.getCanSort()
                          ? ({
                              asc: 'Sort descending',
                              desc: 'Clear sort',
                            }[header.column.getIsSorted() as string] ?? 'Sort ascending')
                          : undefined
                      }
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() &&
                        header.id !== 'actions' &&
                        header.id !== 'select' &&
                        ({
                          asc: <span className={styles.sortArrow}>↑</span>,
                          desc: <span className={styles.sortArrow}>↓</span>,
                        }[header.column.getIsSorted() as string] ?? (
                          <span className={styles.sortArrowNeutral}>↕</span>
                        ))}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                    <tr key={`skel-${rowIdx}`} className={styles.skeletonRow}>
                      {columns.map((_, colIdx) => {
                        const widths = [
                          'skeletonBarLong',
                          'skeletonBarMedium',
                          'skeletonBarShort',
                        ] as const;
                        const w = widths[(rowIdx + colIdx) % widths.length];
                        return (
                          <td key={colIdx} className={styles.skeletonCell}>
                            <div className={`${styles.skeletonBar} ${styles[w]}`} />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                : table.getRowModel().rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`${styles.tableRow} ${idx % 2 === 1 ? styles.tableRowAlt : ''}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={styles.tableCell}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
              {!isLoading && !table.getRowModel().rows.length && (
                <tr>
                  <td colSpan={columns.length} className={styles.emptyState}>
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPagination && data.length > 0 && paginationNode(false)}
    </div>
  );
}
