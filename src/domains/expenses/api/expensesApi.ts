// Thin fetch wrappers for STORY-054/STORY-055 (Expense entry, expense list,
// and cash detail view) — mirrors ai-ui/src/domains/purchasing/api/purchasingApi.ts's
// exact shape (credentials: 'include', `${API_BASE}/...`, explicitly-typed
// envelope unwrap). Every endpoint here already existed unchanged from
// Sprint 6 (STORY-025/026) — this sprint adds no backend surface (PRD §2).
//
// Response shapes below are copied 1:1 from
// ai-backend/src/expenses/expenses.interface.ts — keep them in sync if that
// file ever changes.
//
// Deliberately does NOT duplicate fetchBranches (branch picker reuses
// ai-ui/src/domains/branches/api/branchesApi.ts directly, PRD §2/§4) or the
// cash/daily fetcher (the cash detail view reuses fetchDailyCash/
// DailyCashResponse from ai-ui/src/domains/pharmacy-dashboard/api/dashboardApi.ts
// directly — same endpoint Sprint 7's dashboard tile already calls for
// "today", just with a date picker instead of a hardcoded today).

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class ExpensesApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ExpensesApiError';
  }
}

export interface Expense {
  expenseId: number;
  tenantId: number;
  branchId: number;
  category: string;
  amount: number;
  description: string | null;
  expenseDate: string | null;
  recordedBy: number | null;
  createdAt: string | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateExpenseInput {
  branchId: number;
  category: string;
  amount: number;
  description?: string;
  expenseDate: string;
}

export interface ListExpensesFilter {
  branchId?: number;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  per_page?: number;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    throw new ExpensesApiError(res.status, `Request failed (${res.status}): ${url}`);
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
    throw new ExpensesApiError(res.status, message);
  }
  return (await res.json()) as T;
}

function buildListQuery(filter: ListExpensesFilter): string {
  const params = new URLSearchParams();
  if (filter.branchId != null) params.set('branchId', String(filter.branchId));
  // Backend matches category exactly (ListExpensesQueryDto has no LIKE/
  // contains support) — don't send it unless the user typed something.
  if (filter.category) params.set('category', filter.category);
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  params.set('page', String(filter.page ?? 1));
  params.set('per_page', String(filter.per_page ?? 100));
  return params.toString();
}

// GET /tenants/:tenantId/expenses (expense:read)
export async function fetchExpenses(
  tenantId: number,
  filter: ListExpensesFilter = {},
  signal?: AbortSignal
): Promise<{ data: Expense[]; meta: PaginatedMeta }> {
  return getJson<{ data: Expense[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/expenses?${buildListQuery(filter)}`,
    signal
  );
}

// POST /tenants/:tenantId/expenses (expense:create)
export async function createExpense(tenantId: number, input: CreateExpenseInput): Promise<Expense> {
  const json = await postJson<{ success: boolean; data: Expense }>(
    `${API_BASE}/tenants/${tenantId}/expenses`,
    input
  );
  return json.data;
}
