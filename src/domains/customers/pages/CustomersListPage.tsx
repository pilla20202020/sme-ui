import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchCustomers, type Customer } from '../api/customersApi';
import { CustomerFormModal } from './CustomerFormModal';
import styles from './CustomersListPage.module.css';

// STORY-045 — Customer management screen. Create-and-list only: the
// backend has no PATCH/deactivate endpoint for customers (PRD §3), so
// unlike catalog's ProductsListPage there is no edit modal or row actions
// column. Search is server-side (name OR phone, case-insensitive) via the
// existing `search` query param — same pattern as catalog's product search.
export function CustomersListPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = hasPermission('customer:create');
  const canRead = hasPermission('customer:read');

  const customersQuery = useQuery({
    queryKey: ['customers', tenantId, search],
    queryFn: ({ signal }) =>
      fetchCustomers(tenantId as number, { search: search || undefined }, signal),
    enabled: tenantId != null && canRead,
  });

  const columns: ColumnDef<Customer>[] = useMemo(
    () => [
      { key: 'name', header: 'Name', render: (r) => r.name },
      { key: 'phone', header: 'Phone', render: (r) => r.phone ?? '—' },
      { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
      {
        key: 'isActive',
        header: 'Status',
        render: (r) => (
          <span style={{ color: r.isActive ? T.green : T.textMuted, fontWeight: 600 }}>
            {r.isActive ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ],
    [T]
  );

  if (!canRead) {
    return (
      <div>
        <Topbar title="Customers" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view customers.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Customers" subtitle={tenantName ?? undefined} />

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
          />
        </div>

        {canCreate && (
          <button
            type="button"
            className={styles.addBtn}
            style={{ background: T.indigo }}
            onClick={() => setShowCreate(true)}
          >
            + Add Customer
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        {customersQuery.isLoading ? (
          <Spinner size="sm" />
        ) : customersQuery.isError ? (
          <div style={{ color: T.red }}>Couldn&apos;t load customers.</div>
        ) : (
          <DataTable
            data={customersQuery.data?.data ?? []}
            columns={columns}
            getRowKey={(r) => r.customerId}
            emptyMessage="No customers found."
          />
        )}
      </div>

      {showCreate && tenantId != null && (
        <CustomerFormModal tenantId={tenantId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

export default CustomersListPage;
