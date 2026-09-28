// Thin fetch wrappers for STORY-043 (Staff invite & user list screen) —
// mirrors ai-ui/src/domains/catalog/api/catalogApi.ts's exact shape
// (credentials: 'include', `${API_BASE}/...`, explicitly-typed envelope
// unwrap). Every endpoint here already existed from Sprint 1 — no backend
// changes this sprint (PRD §2).
//
// GOTCHA (verified by reading ai-backend/src/users/users.service.ts
// directly, not assumed): `GET /tenants/:tenantId/users` returns SafeUser
// records that do NOT include roleName at all — SAFE_USER_SELECT never
// selects the user's role relation. Only the POST /users invite response
// (InvitedUser) carries roleName, because the service tacks it on there
// from the request DTO rather than reading it back from the DB. So the
// staff list's Role column can only ever be populated for users invited
// during the current browser session (see StaffListPage's roleByUserId
// map) — pre-existing staff show "—" for role. This is a real backend gap,
// not a frontend oversight; flagged in impl-notes.md for QA/PM.

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class StaffApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'StaffApiError';
  }
}

// Keep in sync with TENANT_ASSIGNABLE_ROLES in
// ai-backend/src/users/dto/invite-user.dto.ts. `admin` is intentionally
// never in this list — it's SSO-only by design (PRD §2), never offered
// here even as a disabled option.
export const TENANT_ASSIGNABLE_ROLES = [
  'owner',
  'manager',
  'cashier',
  'inventory_staff',
  'accountant',
] as const;

export type TenantAssignableRole = (typeof TENANT_ASSIGNABLE_ROLES)[number];

export interface StaffMember {
  userId: number;
  ssoUserId: number | null;
  tenantId: number | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  lastLoggedInAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface InvitedStaffMember extends StaffMember {
  roleName: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface InviteStaffInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleName: TenantAssignableRole;
  password: string;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    throw new StaffApiError(res.status, `Request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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
    throw new StaffApiError(res.status, message);
  }
  return (await res.json()) as T;
}

// ── Staff ────────────────────────────────────────────────────────────────

export async function fetchStaff(
  tenantId: number,
  signal?: AbortSignal
): Promise<{ data: StaffMember[]; meta: PaginatedMeta }> {
  return getJson<{ data: StaffMember[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/users?per_page=100`,
    signal
  );
}

export async function inviteStaff(
  tenantId: number,
  input: InviteStaffInput
): Promise<InvitedStaffMember> {
  const json = await postJson<{ success: boolean; data: InvitedStaffMember }>(
    `${API_BASE}/tenants/${tenantId}/users`,
    input
  );
  return json.data;
}
