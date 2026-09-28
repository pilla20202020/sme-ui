import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchBranches, type Branch } from '../api/branchesApi';
import { BranchFormModal } from './BranchFormModal';
import styles from './BranchesListPage.module.css';

// STORY-042 — Branch management screen. Create-and-list only: the backend
// has no PATCH/deactivate endpoint for branches (PRD §3/§7), so unlike
// catalog's ProductsListPage there is no edit modal or row actions column.
export function BranchesListPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();

  const [showCreate, setShowCreate] = useState(false);

  const canCreate = hasPermission('branch:create');
  const canRead = hasPermission('branch:read');

  const branchesQuery = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: ({ signal }) => fetchBranches(tenantId as number, signal),
    enabled: tenantId != null && canRead,
  });

  const columns: ColumnDef<Branch>[] = useMemo(
    () => [
      { key: 'name', header: 'Name', render: (r) => r.name },
      { key: 'address', header: 'Address', render: (r) => r.address ?? '—' },
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
        <Topbar title="Branches" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view branches.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Branches" subtitle={tenantName ?? undefined} />

      <div className={styles.toolbar}>
        <div />
        {canCreate && (
          <button
            type="button"
            className={styles.addBtn}
            style={{ background: T.indigo }}
            onClick={() => setShowCreate(true)}
          >
            + Add Branch
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        {branchesQuery.isLoading ? (
          <Spinner size="sm" />
        ) : branchesQuery.isError ? (
          <div style={{ color: T.red }}>Couldn&apos;t load branches.</div>
        ) : (
          <DataTable
            data={branchesQuery.data?.data ?? []}
            columns={columns}
            getRowKey={(r) => r.branchId}
            emptyMessage="No branches found."
          />
        )}
      </div>

      {showCreate && tenantId != null && (
        <BranchFormModal tenantId={tenantId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

export default BranchesListPage;
