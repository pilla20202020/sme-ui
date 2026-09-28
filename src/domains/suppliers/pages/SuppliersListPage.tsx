import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchSuppliers, type Supplier } from '../api/suppliersApi';
import { SupplierFormModal } from './SupplierFormModal';
import styles from './SuppliersListPage.module.css';

// STORY-046 — Supplier management screen. Create-and-list only: the
// backend has no PATCH/deactivate endpoint for suppliers (PRD §4), so
// unlike catalog's ProductsListPage there is no edit modal or row actions
// column.
//
// Deliberately NO search box here (PRD §4): GET
// /tenants/:tenantId/suppliers has no search filter on the backend at
// all — plain pagination only. Do not add one client-side over the
// unfiltered fetch; see suppliersApi.ts's GOTCHA comment for the full
// reasoning.
export function SuppliersListPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();

  const [showCreate, setShowCreate] = useState(false);

  const canCreate = hasPermission('supplier:create');
  const canRead = hasPermission('supplier:read');

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', tenantId],
    queryFn: ({ signal }) => fetchSuppliers(tenantId as number, signal),
    enabled: tenantId != null && canRead,
  });

  const columns: ColumnDef<Supplier>[] = useMemo(
    () => [
      { key: 'name', header: 'Name', render: (r) => r.name },
      { key: 'contactPerson', header: 'Contact Person', render: (r) => r.contactPerson ?? '—' },
      { key: 'phone', header: 'Phone', render: (r) => r.phone ?? '—' },
      { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
      { key: 'paymentTerms', header: 'Payment Terms', render: (r) => r.paymentTerms ?? '—' },
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
        <Topbar title="Suppliers" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view suppliers.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Suppliers" subtitle={tenantName ?? undefined} />

      <div className={styles.toolbar}>
        <div />
        {canCreate && (
          <button
            type="button"
            className={styles.addBtn}
            style={{ background: T.indigo }}
            onClick={() => setShowCreate(true)}
          >
            + Add Supplier
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        {suppliersQuery.isLoading ? (
          <Spinner size="sm" />
        ) : suppliersQuery.isError ? (
          <div style={{ color: T.red }}>Couldn&apos;t load suppliers.</div>
        ) : (
          <DataTable
            data={suppliersQuery.data?.data ?? []}
            columns={columns}
            getRowKey={(r) => r.supplierId}
            emptyMessage="No suppliers found."
          />
        )}
      </div>

      {showCreate && tenantId != null && (
        <SupplierFormModal tenantId={tenantId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

export default SuppliersListPage;
