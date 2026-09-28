import { useState, useMemo } from 'react';
import { useTheme } from '@/app/providers/ThemeContext';

export interface ColumnDef<T> {
  key: string;
  header: string;
  group?: string;
  render: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: number | string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowKey: (row: T) => string | number;
  pageSize?: number;
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  sortCol?: string | null;
  sortDir?: 'asc' | 'desc';
  emptyMessage?: string;
}

function paginationBtnStyle(disabled: boolean, active: boolean, theme: any): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid ' + (active ? '#00ccff' : theme.border),
    background: active ? '#00ccff' : theme.bgCard,
    color: active ? '#ffffff' : disabled ? theme.textMuted : theme.text,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.15s ease',
    fontFamily: "'DM Sans', sans-serif",
  };
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  pageSize = 10,
  onSort,
  sortCol,
  sortDir,
  emptyMessage = 'No data found.',
}: DataTableProps<T>) {
  const { T: theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(pageSize);
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);

  const totalPages = Math.max(1, Math.ceil(data.length / localPageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * localPageSize;
    return data.slice(start, start + localPageSize);
  }, [data, safeCurrentPage, localPageSize]);

  // Reset to page 1 when data length changes significantly
  useMemo(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [data.length]);

  // Group headers
  const groups = useMemo(() => {
    const seen: { name: string; span: number }[] = [];
    let lastGroup: string | undefined;
    columns.forEach((col) => {
      if (col.group && col.group === lastGroup) {
        seen[seen.length - 1].span++;
      } else {
        seen.push({ name: col.group || '', span: 1 });
        lastGroup = col.group;
      }
    });
    return seen;
  }, [columns]);

  const hasGroups = columns.some((col) => col.group);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{ background: theme.bgCard, borderRadius: 14, boxShadow: theme.shadow, border: '1px solid ' + theme.border, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          {hasGroups && (
            <thead>
              <tr style={{ background: theme.bgAlt }}>
                {groups.map((g, i) => (
                  <th
                    key={i}
                    colSpan={g.span}
                    style={{
                      padding: '8px 14px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      color: g.name ? theme.indigo : 'transparent',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      borderBottom: '1px solid ' + theme.border,
                      borderRight: i < groups.length - 1 ? '1px solid ' + theme.borderLight : 'none',
                    }}
                  >
                    {g.name || ''}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <thead>
            <tr style={{ background: theme.bgAlt }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key, sortCol === col.key && sortDir === 'asc' ? 'desc' : 'asc')}
                  style={{
                    padding: '11px 14px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    cursor: col.sortable ? 'pointer' : 'default',
                    borderBottom: '2px solid ' + theme.border,
                    whiteSpace: 'nowrap',
                    minWidth: col.width || 'auto',
                    userSelect: 'none',
                  }}
                >
                  {col.header}
                  {sortCol === col.key && (
                    <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => {
              const key = getRowKey(row);
              return (
                <tr
                  key={key}
                  style={{
                    background: hoveredRow === key ? theme.bgHover : idx % 2 === 1 ? theme.bgAlt : theme.bgCard,
                    transition: 'background 0.15s',
                    borderBottom: '1px solid ' + theme.borderLight,
                  }}
                  onMouseEnter={() => setHoveredRow(key)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '10px 14px' }}>
                      {col.render(row, idx)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {!paginatedData.length && (
              <tr>
                <td colSpan={columns.length} style={{ padding: 40, textAlign: 'center', color: theme.textMuted, fontSize: 13 }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid ' + theme.border,
            fontFamily: "'DM Sans', sans-serif",
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {/* Left: rows-per-page + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: theme.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>
              Rows per page:
              <select
                value={localPageSize}
                onChange={e => { setLocalPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{ height: 32, padding: '0 8px', borderRadius: 8, border: '1px solid ' + theme.border, background: theme.bgCard, color: theme.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', outline: 'none' }}
              >
                {[5, 10, 20, 50].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>
              Showing {(safeCurrentPage - 1) * localPageSize + 1}–{Math.min(safeCurrentPage * localPageSize, data.length)} of {data.length}
            </span>
          </div>

          {/* Right: navigation buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(1)}
              style={paginationBtnStyle(safeCurrentPage === 1, false, theme)}
            >«</button>
            <button
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={paginationBtnStyle(safeCurrentPage === 1, false, theme)}
            >‹</button>
            {getPageNumbers().map((page, i) =>
              page === '...' ? (
                <span key={`dot-${i}`} style={{ padding: '0 4px', color: theme.textMuted, fontSize: 12 }}>…</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  style={paginationBtnStyle(false, page === safeCurrentPage, theme)}
                >
                  {page}
                </button>
              )
            )}
            <button
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={paginationBtnStyle(safeCurrentPage === totalPages, false, theme)}
            >›</button>
            <button
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              style={paginationBtnStyle(safeCurrentPage === totalPages, false, theme)}
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
}



