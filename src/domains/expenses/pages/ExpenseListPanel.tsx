import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchBranches, type Branch } from '@/domains/branches/api/branchesApi';
import { fetchExpenses, type Expense } from '../api/expensesApi';
import { ExpenseFormModal } from './ExpenseFormModal';
import styles from './ExpensesPage.module.css';

interface ExpenseListPanelProps {
  tenantId: number;
}

// STORY-055 (list half) — a paginated, filterable expense list. Filterable
// by branch/category/date-range, all backend-supported (PRD §4). Category is
// a free-text input, not a <select>, matching the backend's exact-match, no-
// taxonomy filter (ListExpensesQueryDto has no LIKE/contains support) — a
// typed value that doesn't match any recorded category exactly just yields
// an empty list, same as the backend would.
export function ExpenseListPanel({ tenantId }: ExpenseListPanelProps) {
  const { T } = useTheme();
  const { hasPermission } = useAuth();

  const [branchFilter, setBranchFilter] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = hasPermission('expense:create');

  const branchesQuery = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: ({ signal }) => fetchBranches(tenantId, signal),
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses', 'list', tenantId, branchFilter, categoryFilter, dateFrom, dateTo],
    queryFn: ({ signal }) =>
      fetchExpenses(
        tenantId,
        {
          branchId: branchFilter || undefined,
          category: categoryFilter.trim() || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          per_page: 100,
        },
        signal
      ),
  });

  const branchById = useMemo(() => {
    const map = new Map<number, Branch>();
    (branchesQuery.data?.data ?? []).forEach((b) => map.set(b.branchId, b));
    return map;
  }, [branchesQuery.data]);

  const columns: ColumnDef<Expense>[] = useMemo(
    () => [
      {
        key: 'branch',
        header: 'Branch',
        render: (r) => branchById.get(r.branchId)?.name ?? `Branch #${r.branchId}`,
      },
      { key: 'category', header: 'Category', render: (r) => r.category },
      {
        key: 'amount',
        header: 'Amount',
        render: (r) =>
          r.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
      { key: 'description', header: 'Description', render: (r) => r.description ?? '—' },
      {
        key: 'expenseDate',
        header: 'Date',
        render: (r) => (r.expenseDate ? new Date(r.expenseDate).toLocaleDateString() : '—'),
      },
    ],
    [branchById]
  );

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value === '' ? '' : Number(e.target.value))}
            className={styles.filterSelect}
            style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
          >
            <option value="">All branches</option>
            {(branchesQuery.data?.data ?? []).map((b) => (
              <option key={b.branchId} value={b.branchId}>
                {b.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter by category…"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterInput}
            style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
          />

          <label className={styles.filterLabel} style={{ color: T.textMuted }}>
            From
            <DatePicker value={dateFrom} onChange={setDateFrom} />
          </label>
          <label className={styles.filterLabel} style={{ color: T.textMuted }}>
            To
            <DatePicker value={dateTo} onChange={setDateTo} />
          </label>
        </div>

        {canCreate && (
          <button
            type="button"
            className={styles.addBtn}
            style={{ background: T.indigo }}
            onClick={() => setShowCreate(true)}
          >
            + Record Expense
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        {expensesQuery.isLoading ? (
          <Spinner size="sm" />
        ) : expensesQuery.isError ? (
          <div style={{ color: T.red }}>Couldn&apos;t load expenses.</div>
        ) : (
          <DataTable
            data={expensesQuery.data?.data ?? []}
            columns={columns}
            getRowKey={(r) => r.expenseId}
            emptyMessage="No expenses found."
          />
        )}
      </div>

      {showCreate && <ExpenseFormModal tenantId={tenantId} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

export default ExpenseListPanel;
