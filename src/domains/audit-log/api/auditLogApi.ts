// Thin fetch wrappers for STORY-056 (Audit log viewer) — mirrors every other
// domain's exact shape (credentials: 'include', `${API_BASE}/...`,
// explicitly-typed envelope unwrap, no `any`). Both endpoints below already
// existed unchanged before this sprint (PRD §2/§3): the audit-logs endpoint
// since Sprint 3 (STORY-036/037), the tenants list since Sprint 1 — this
// sprint adds no backend surface at all.
//
// Response shapes are copied 1:1 from ai-backend/src/audit/audit-logs.interface.ts
// (AuditLogResponse) and ai-backend/src/tenants/tenants.interface.ts
// (TenantResponse) — keep them in sync if those files ever change.
//
// IMPORTANT (PRD §2/§3, verified by reading the controllers directly):
// - GET /tenants/:tenantId/audit-logs is stacked @Roles('admin') AND
//   @Permissions('audit:read') — admin/support only, deliberately excluding
//   even the tenant's own owner.
// - GET /tenants (used here as the tenant picker's data source) is stacked
//   @Roles('admin') AND @Permissions('tenant:read') — also admin-only, and
//   is a genuine cross-tenant listing, unlike every other tenant-scoped
//   fetch in this codebase.
// - `action` filtering on the audit-logs endpoint is EXACT MATCH only
//   (ListAuditLogsQueryDto has no LIKE/contains support) — the filter UI
//   must not imply substring search.

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class AuditLogApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'AuditLogApiError';
  }
}

export interface AuditLogEntry {
  id: string;
  tenantId: number;
  actorUserId: number | null;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ListAuditLogsFilter {
  actorUserId?: number;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

// Only the fields this screen's tenant picker actually needs — a subset of
// the backend's full TenantResponse (name/vertical/currency/etc.), not a
// duplicate of it (PRD §2: no broader "admin impersonation" feature, this
// is a plain picker).
export interface TenantOption {
  tenantId: number;
  name: string;
  isActive: boolean;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    let message = `Request failed (${res.status}): ${url}`;
    try {
      const errJson = (await res.json()) as { message?: string | string[] };
      if (errJson.message) {
        message = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
      }
    } catch {
      // response had no JSON body — fall back to the generic message
    }
    throw new AuditLogApiError(res.status, message);
  }
  return (await res.json()) as T;
}

function buildAuditLogsQuery(filter: ListAuditLogsFilter): string {
  const params = new URLSearchParams();
  if (filter.actorUserId != null) params.set('actorUserId', String(filter.actorUserId));
  // Backend matches action exactly (ListAuditLogsQueryDto has no LIKE/
  // contains support) — don't send it unless the user typed something.
  if (filter.action) params.set('action', filter.action);
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  params.set('page', String(filter.page ?? 1));
  // PaginationQueryDto caps per_page at 100 (class-validator @Max(100)) —
  // unlike a couple of other domains' DTOs, this one does not raise that
  // cap, so 100 is the real ceiling here.
  params.set('per_page', String(filter.per_page ?? 100));
  return params.toString();
}

// GET /tenants/:tenantId/audit-logs (admin + audit:read)
export async function fetchAuditLogs(
  tenantId: number,
  filter: ListAuditLogsFilter = {},
  signal?: AbortSignal
): Promise<{ data: AuditLogEntry[]; meta: PaginatedMeta }> {
  return getJson<{ data: AuditLogEntry[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/audit-logs?${buildAuditLogsQuery(filter)}`,
    signal
  );
}

// GET /tenants (admin + tenant:read) — cross-tenant listing, reused here
// unmodified as this screen's tenant-picker data source (PRD §3/§4). Capped
// at per_page=100 (the DTO's max) — in the unlikely event this platform
// ever hosts more tenants than that, the picker would need real pagination,
// out of scope for this sprint (PRD §5).
export async function fetchTenants(
  signal?: AbortSignal
): Promise<{ data: TenantOption[]; meta: PaginatedMeta }> {
  return getJson<{ data: TenantOption[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants?page=1&per_page=100`,
    signal
  );
}
