// Thin fetch wrappers for the two backend endpoints STORY-027 reuses —
// mirrors ai-ui/src/domains/auth/api/authApi.ts's exact fetch pattern
// (credentials: 'include', `${API_BASE}/...`, unwrap `{ success, data }` /
// `{ success, data, meta }`). No new backend endpoint is added for this
// story (PRD §4).

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class DashboardApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

export interface DailyCashResponse {
  date: string;
  salesTotal: number;
  returnsTotal: number;
  expensesTotal: number;
  netCashPosition: number;
  saleCount: number;
  returnCount: number;
  expenseCount: number;
}

export interface LowStockAlertEntry {
  productId: number;
  name: string;
  sku: string | null;
  reorderThreshold: number;
  totalOnHand: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** GET /tenants/:tenantId/cash/daily?date=YYYY-MM-DD (Sprint 6, unmodified). */
export async function fetchDailyCash(
  tenantId: number,
  date: string,
  signal?: AbortSignal
): Promise<DailyCashResponse> {
  const res = await fetch(
    `${API_BASE}/tenants/${tenantId}/cash/daily?date=${encodeURIComponent(date)}`,
    { signal, credentials: 'include' }
  );
  if (!res.ok) {
    throw new DashboardApiError(res.status, `Failed to fetch daily cash (${res.status})`);
  }
  const json = (await res.json()) as { success: boolean; data: DailyCashResponse };
  return json.data;
}

/**
 * GET /tenants/:tenantId/inventory/alerts/low-stock (Sprint 4, unmodified,
 * paginated). Only `meta.total` is used by the KPI tile (PRD §4) — the
 * per_page=1 request keeps the payload minimal since row detail isn't
 * rendered on the dashboard, only the count.
 */
export async function fetchLowStockCount(tenantId: number, signal?: AbortSignal): Promise<number> {
  const res = await fetch(
    `${API_BASE}/tenants/${tenantId}/inventory/alerts/low-stock?page=1&per_page=1`,
    { signal, credentials: 'include' }
  );
  if (!res.ok) {
    throw new DashboardApiError(res.status, `Failed to fetch low-stock alerts (${res.status})`);
  }
  const json = (await res.json()) as {
    success: boolean;
    data: LowStockAlertEntry[];
    meta: PaginatedMeta;
  };
  return json.meta.total;
}
