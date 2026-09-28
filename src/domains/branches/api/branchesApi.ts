// Thin fetch wrappers for STORY-042 (Branch management screen) — mirrors
// ai-ui/src/domains/catalog/api/catalogApi.ts's exact shape (credentials:
// 'include', `${API_BASE}/...`, explicitly-typed envelope unwrap). Every
// endpoint here already existed from Sprint 1 — no backend changes this
// sprint (PRD §2).

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class BranchesApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'BranchesApiError';
  }
}

export interface Branch {
  branchId: number;
  tenantId: number;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateBranchInput {
  name: string;
  address?: string;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    throw new BranchesApiError(res.status, `Request failed (${res.status}): ${url}`);
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
    throw new BranchesApiError(res.status, message);
  }
  return (await res.json()) as T;
}

// ── Branches ─────────────────────────────────────────────────────────────
// Create-and-list only (PRD §3 / §7): the backend has no PATCH/deactivate
// endpoint for branches at all, so there is nothing to wire up beyond these
// two calls.

export async function fetchBranches(
  tenantId: number,
  signal?: AbortSignal
): Promise<{ data: Branch[]; meta: PaginatedMeta }> {
  return getJson<{ data: Branch[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/branches?per_page=100`,
    signal
  );
}

export async function createBranch(tenantId: number, input: CreateBranchInput): Promise<Branch> {
  const json = await postJson<{ success: boolean; data: Branch }>(
    `${API_BASE}/tenants/${tenantId}/branches`,
    input
  );
  return json.data;
}
