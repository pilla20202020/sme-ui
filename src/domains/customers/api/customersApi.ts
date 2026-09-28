// Thin fetch wrappers for STORY-045 (Customer management screen) — mirrors
// ai-ui/src/domains/branches/api/branchesApi.ts's exact shape (credentials:
// 'include', `${API_BASE}/...`, explicitly-typed envelope unwrap). Every
// endpoint here already existed from Sprint 2 — no backend changes this
// sprint (PRD §2), including the `search` query param, which already
// supports name OR phone, case-insensitive, server-side.

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class CustomersApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'CustomersApiError';
  }
}

export interface Customer {
  customerId: number;
  tenantId: number;
  name: string;
  phone: string | null;
  email: string | null;
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

export interface CustomerListFilter {
  search?: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    throw new CustomersApiError(res.status, `Request failed (${res.status}): ${url}`);
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
    throw new CustomersApiError(res.status, message);
  }
  return (await res.json()) as T;
}

function buildCustomerQuery(filter: CustomerListFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set('search', filter.search);
  params.set('per_page', '100');
  return params.toString();
}

// ── Customers ────────────────────────────────────────────────────────────
// Create-and-list only (PRD §3): the backend has no PATCH/deactivate
// endpoint for customers at all, so there is nothing to wire up beyond
// these two calls.

export async function fetchCustomers(
  tenantId: number,
  filter: CustomerListFilter,
  signal?: AbortSignal
): Promise<{ data: Customer[]; meta: PaginatedMeta }> {
  return getJson<{ data: Customer[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/customers?${buildCustomerQuery(filter)}`,
    signal
  );
}

export async function createCustomer(
  tenantId: number,
  input: CreateCustomerInput
): Promise<Customer> {
  const json = await postJson<{ success: boolean; data: Customer }>(
    `${API_BASE}/tenants/${tenantId}/customers`,
    input
  );
  return json.data;
}
