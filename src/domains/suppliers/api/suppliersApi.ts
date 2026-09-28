// Thin fetch wrappers for STORY-046 (Supplier management screen) — mirrors
// ai-ui/src/domains/branches/api/branchesApi.ts's exact shape (credentials:
// 'include', `${API_BASE}/...`, explicitly-typed envelope unwrap). Every
// endpoint here already existed from Sprint 2 — no backend changes this
// sprint (PRD §2).
//
// GOTCHA (PRD §2/§4): unlike customersApi's fetchCustomers, there is
// deliberately no filter/search param here — GET
// /tenants/:tenantId/suppliers has no search filter on the backend at all
// (plain pagination only). Do not add a `search` param to this call or a
// client-side `.filter()` in the page that consumes it — that would violate
// this project's established server-side-filtering-only convention flagged
// in every prior sprint's QA pass. A supplier search filter is out of this
// sprint's zero-backend-changes scope; if wanted later, it's a small,
// separate backend+frontend follow-up.

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class SuppliersApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'SuppliersApiError';
  }
}

export interface Supplier {
  supplierId: number;
  tenantId: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  paymentTerms: string | null;
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

export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  paymentTerms?: string;
  address?: string;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    throw new SuppliersApiError(res.status, `Request failed (${res.status}): ${url}`);
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
    throw new SuppliersApiError(res.status, message);
  }
  return (await res.json()) as T;
}

// ── Suppliers ────────────────────────────────────────────────────────────
// Create-and-list only (PRD §4): the backend has no PATCH/deactivate
// endpoint for suppliers at all, so there is nothing to wire up beyond
// these two calls.

export async function fetchSuppliers(
  tenantId: number,
  signal?: AbortSignal
): Promise<{ data: Supplier[]; meta: PaginatedMeta }> {
  return getJson<{ data: Supplier[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/suppliers?per_page=100`,
    signal
  );
}

export async function createSupplier(
  tenantId: number,
  input: CreateSupplierInput
): Promise<Supplier> {
  const json = await postJson<{ success: boolean; data: Supplier }>(
    `${API_BASE}/tenants/${tenantId}/suppliers`,
    input
  );
  return json.data;
}
