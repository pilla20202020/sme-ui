import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { DataTable, type ColumnDef } from '@/shared/components/ui/DataTable/DataTable';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Spinner } from '@/shared/components/ui/Spinner';
import { fetchAuditLogs, fetchTenants, type AuditLogEntry } from '../api/auditLogApi';
import styles from './AuditLogPage.module.css';

// SPRINT-016 — Audit log viewer (EPIC-013 UI, STORY-056). The one deliberate
// structural exception in this codebase (PRD §1): every prior domain read
// `useAuth().tenantId` and showed "my own tenant's" data. This screen is
// admin/support-only and cross-tenant — an admin session's own tenantId is
// always null (PRD §3) — so the chosen tenant lives entirely in this
// component's own local state, never in AuthContext, and nothing is fetched
// until a tenant is actually picked (PRD §4).
//
// Route-level gating (hasRole('admin'), not hasPermission — PRD §2/§3) lives
// in AppRouter's AdminShell, mirroring every prior sprint's "omit the route
// and nav entry entirely" pattern. This component doesn't re-check the role
// itself: it is unreachable for anyone else, the same way e.g. ExpensesPage
// never re-checks expense:read/cash:read at the component root either.
export function AuditLogPage() {
  const { T } = useTheme();
  const { tenantName } = useAuth();

  const [tenantId, setTenantId] = useState<number | ''>('');
  const [tenantIdJump, setTenantIdJump] = useState('');
  const [actorUserId, setActorUserId] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const tenantsQuery = useQuery({
    queryKey: ['audit-log', 'tenants'],
    queryFn: ({ signal }) => fetchTenants(signal),
  });

  const auditLogsQuery = useQuery({
    queryKey: ['audit-log', 'entries', tenantId, actorUserId, action, dateFrom, dateTo],
    queryFn: ({ signal }) =>
      fetchAuditLogs(
        tenantId as number,
        {
          actorUserId: actorUserId.trim() ? Number(actorUserId) : undefined,
          // Exact match only (ListAuditLogsQueryDto has no LIKE/contains
          // support, PRD §3/§4) — sent verbatim, never as a substring.
          action: action.trim() || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
          per_page: 100,
        },
        signal
      ),
    enabled: tenantId !== '',
  });

  const columns: ColumnDef<AuditLogEntry>[] = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Timestamp',
        render: (r) => r.createdAt ?? '—',
      },
      {
        key: 'actor',
        header: 'Actor',
        render: (r) => (
          <span>
            {r.actorLabel}
            {r.actorUserId != null && (
              <span style={{ color: T.textMuted }}> (#{r.actorUserId})</span>
            )}
          </span>
        ),
      },
      { key: 'action', header: 'Action', render: (r) => r.action },
      {
        key: 'target',
        header: 'Target',
        render: (r) => `${r.targetType}${r.targetId != null ? ` #${r.targetId}` : ''}`,
      },
      {
        key: 'metadata',
        header: 'Metadata',
        // Admin/support diagnostic tool, not a polished end-user screen —
        // a plain expandable <pre> of the raw JSON is acceptable (PRD §4).
        render: (r) =>
          r.metadata == null ? (
            <span style={{ color: T.textMuted }}>—</span>
          ) : (
            <details>
              <summary className={styles.metadataSummary} style={{ color: T.indigo }}>
                View
              </summary>
              <pre
                className={styles.metadataPre}
                style={{ background: T.bgAlt, border: `1px solid ${T.border}`, color: T.text }}
              >
                {JSON.stringify(r.metadata, null, 2)}
              </pre>
            </details>
          ),
      },
    ],
    [T]
  );

  return (
    <div>
      <Topbar title="Audit Log" subtitle={tenantName ?? undefined} />

      <div className={styles.content}>
        <div className={styles.tenantPicker}>
          <label className={styles.filterLabel} style={{ color: T.textMuted }}>
            Tenant
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value === '' ? '' : Number(e.target.value))}
              className={styles.tenantSelect}
              style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
            >
              <option value="">Select a tenant…</option>
              {(tenantsQuery.data?.data ?? []).map((t) => (
                <option key={t.tenantId} value={t.tenantId}>
                  {t.name} (#{t.tenantId}){t.isActive ? '' : ' — inactive'}
                </option>
              ))}
            </select>
          </label>
          {tenantsQuery.isLoading && <Spinner size="sm" />}
          {tenantsQuery.isError && (
            <span style={{ color: T.red, fontSize: 13 }}>Couldn&apos;t load tenants.</span>
          )}

          {/* GET /tenants has no search/filter param and this dev platform
              has hundreds of tenants (verified live: 881, mostly short-lived
              QA fixtures) — ordered createdAt desc and capped at the DTO's
              max per_page=100, the dropdown above only ever shows the 100
              most-recently-created tenants. Verified live that tenant 514
              ("Kathmandu Pharmacy", this app's actual demo tenant) is NOT
              among them. Rather than fetch all pages (unbounded, wasteful)
              or add a backend search param (out of scope, PRD §5), this
              plain "jump to ID" input is the pragmatic escape hatch — the
              same admin/support user who already knows which tenant they're
              investigating (the normal case for a support tool) can always
              reach it directly. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tenantIdJump.trim()) setTenantId(Number(tenantIdJump));
            }}
            style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}
          >
            <label className={styles.filterLabel} style={{ color: T.textMuted }}>
              Or jump to tenant ID
              <input
                type="number"
                placeholder="e.g. 514"
                value={tenantIdJump}
                onChange={(e) => setTenantIdJump(e.target.value)}
                className={styles.filterInput}
                style={{
                  border: `1px solid ${T.border}`,
                  background: T.bgCard,
                  color: T.text,
                  width: 120,
                }}
              />
            </label>
            <button
              type="submit"
              className={styles.filterInput}
              style={{
                border: `1px solid ${T.border}`,
                background: T.bgCard,
                color: T.text,
                cursor: 'pointer',
                width: 'auto',
                padding: '0 12px',
              }}
            >
              Go
            </button>
          </form>
        </div>

        {tenantId === '' ? (
          <div className={styles.emptyState} style={{ color: T.textMuted }}>
            Choose a tenant above to view its audit log.
          </div>
        ) : (
          <>
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <label className={styles.filterLabel} style={{ color: T.textMuted }}>
                  Actor user ID
                  <input
                    type="number"
                    placeholder="e.g. 42"
                    value={actorUserId}
                    onChange={(e) => setActorUserId(e.target.value)}
                    className={styles.filterInput}
                    style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
                  />
                </label>
                <label className={styles.filterLabel} style={{ color: T.textMuted }}>
                  Action (exact match)
                  <input
                    type="text"
                    placeholder="e.g. product.create"
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className={styles.filterInput}
                    style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.text }}
                  />
                </label>
                <label className={styles.filterLabel} style={{ color: T.textMuted }}>
                  From
                  <DatePicker value={dateFrom} onChange={setDateFrom} />
                </label>
                <label className={styles.filterLabel} style={{ color: T.textMuted }}>
                  To
                  <DatePicker value={dateTo} onChange={setDateTo} />
                </label>
              </div>
            </div>

            <div className={styles.tableWrap}>
              {auditLogsQuery.isLoading ? (
                <Spinner size="sm" />
              ) : auditLogsQuery.isError ? (
                <div style={{ color: T.red }}>Couldn&apos;t load audit log entries.</div>
              ) : (
                <DataTable
                  data={auditLogsQuery.data?.data ?? []}
                  columns={columns}
                  getRowKey={(r) => r.id}
                  emptyMessage="No audit log entries found."
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuditLogPage;
