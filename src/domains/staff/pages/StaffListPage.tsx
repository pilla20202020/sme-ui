import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchStaff, type InvitedStaffMember, type StaffMember } from '../api/staffApi';
import { StaffInviteModal } from './StaffInviteModal';
import styles from './StaffListPage.module.css';

// STORY-043 — Staff invite & user list screen.
export function StaffListPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();

  const [showInvite, setShowInvite] = useState(false);
  // GET /tenants/:tenantId/users never returns roleName (verified against
  // ai-backend/src/users/users.service.ts's SAFE_USER_SELECT — see
  // staffApi.ts's GOTCHA comment). This map is the only place a role is
  // ever known for a user in this UI, populated from each invite response
  // for the lifetime of this page — pre-existing staff show "—" for role.
  const [roleByUserId, setRoleByUserId] = useState<Record<number, string>>({});

  const canCreate = hasPermission('user:create');
  const canRead = hasPermission('user:read');

  const staffQuery = useQuery({
    queryKey: ['staff', tenantId],
    queryFn: ({ signal }) => fetchStaff(tenantId as number, signal),
    enabled: tenantId != null && canRead,
  });

  function handleInvited(user: InvitedStaffMember) {
    setRoleByUserId((prev) => ({ ...prev, [user.userId]: user.roleName }));
  }

  const columns: ColumnDef<StaffMember>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (r) => `${r.firstName} ${r.lastName}`.trim() || '—',
      },
      { key: 'email', header: 'Email', render: (r) => r.email },
      {
        key: 'role',
        header: 'Role',
        render: (r) => roleByUserId[r.userId] ?? '—',
      },
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
    [T, roleByUserId]
  );

  if (!canRead) {
    return (
      <div>
        <Topbar title="Staff" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view staff.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Staff" subtitle={tenantName ?? undefined} />

      <div className={styles.toolbar}>
        <div />
        {canCreate && (
          <button
            type="button"
            className={styles.addBtn}
            style={{ background: T.indigo }}
            onClick={() => setShowInvite(true)}
          >
            + Invite Staff
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        {staffQuery.isLoading ? (
          <Spinner size="sm" />
        ) : staffQuery.isError ? (
          <div style={{ color: T.red }}>Couldn&apos;t load staff.</div>
        ) : (
          <DataTable
            data={staffQuery.data?.data ?? []}
            columns={columns}
            getRowKey={(r) => r.userId}
            emptyMessage="No staff found."
          />
        )}
      </div>

      {showInvite && tenantId != null && (
        <StaffInviteModal
          tenantId={tenantId}
          onClose={() => setShowInvite(false)}
          onInvited={handleInvited}
        />
      )}
    </div>
  );
}

export default StaffListPage;
