// Thin fetch wrappers for STORY-028's three report tabs — mirrors
// ai-ui/src/domains/auth/api/authApi.ts's exact fetch pattern (credentials:
// 'include', `${API_BASE}/...`, unwrap `{ success, data, meta }`). Sales uses
// the new GET /tenants/:tenantId/sales endpoint added this sprint; Stock and
// Purchases reuse existing endpoints unmodified (Purchases now additionally
// accepts dateFrom/dateTo, added this sprint too).

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class ReportsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ReportsApiError';
  }
}

export interface DateRangeFilter {
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

function buildQuery(filter: DateRangeFilter): string {
  const params = new URLSearchParams();
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  params.set('per_page', '100');
  return params.toString();
}

async function getJson<T>(
  url: string,
  signal?: AbortSignal
): Promise<{ data: T; meta: PaginatedMeta }> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    throw new ReportsApiError(res.status, `Request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as { data: T; meta: PaginatedMeta };
}

// ── Sales tab — GET /tenants/:tenantId/sales (new this sprint) ──────────────

export interface SaleLineReportEntry {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SaleReportEntry {
  saleId: number;
  saleDate: string | null;
  customer: { customerId: number; name: string } | null;
  cashier: { userId: number; firstName: string; lastName: string } | null;
  lines: SaleLineReportEntry[];
  subtotal: number;
  total: number;
}

export async function fetchSalesReport(
  tenantId: number,
  filter: DateRangeFilter,
  signal?: AbortSignal
): Promise<SaleReportEntry[]> {
  const json = await getJson<SaleReportEntry[]>(
    `${API_BASE}/tenants/${tenantId}/sales?${buildQuery(filter)}`,
    signal
  );
  return json.data;
}

// ── Stock tab — GET /tenants/:tenantId/inventory/movements (Sprint 4, unmodified) ──

export type InventoryMovementType =
  | 'purchase_receipt'
  | 'sale'
  | 'return'
  | 'adjustment'
  | 'transfer';

export interface InventoryMovementReportEntry {
  movementId: string;
  tenantId: number;
  productId: number;
  productBatchId: number | null;
  movementType: InventoryMovementType;
  quantityDelta: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: number | null;
  actorId: number | null;
  occurredAt: string | null;
}

export async function fetchStockReport(
  tenantId: number,
  filter: DateRangeFilter,
  signal?: AbortSignal
): Promise<InventoryMovementReportEntry[]> {
  const json = await getJson<InventoryMovementReportEntry[]>(
    `${API_BASE}/tenants/${tenantId}/inventory/movements?${buildQuery(filter)}`,
    signal
  );
  return json.data;
}

// ── Purchases tab — GET /tenants/:tenantId/purchase-orders (dateFrom/dateTo new this sprint) ──

export interface PurchaseOrderReportEntry {
  purchaseOrderId: number;
  tenantId: number;
  supplierId: number;
  status: string;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  notes: string | null;
  createdBy: number | null;
  lines: {
    productId: number;
    quantityOrdered: number;
    quantityReceived: number;
    unitCost: number;
  }[];
}

export async function fetchPurchasesReport(
  tenantId: number,
  filter: DateRangeFilter,
  signal?: AbortSignal
): Promise<PurchaseOrderReportEntry[]> {
  const json = await getJson<PurchaseOrderReportEntry[]>(
    `${API_BASE}/tenants/${tenantId}/purchase-orders?${buildQuery(filter)}`,
    signal
  );
  return json.data;
}
