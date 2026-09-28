// Thin fetch wrappers for STORY-047/STORY-048 (Purchase order creation/list +
// stock receiving UI) — mirrors ai-ui/src/domains/suppliers/api/suppliersApi.ts's
// exact shape (credentials: 'include', `${API_BASE}/...`, explicitly-typed
// envelope unwrap). Every endpoint here already existed unchanged from
// Sprint 3 (STORY-012..014) — this sprint adds no backend surface (PRD §2).
//
// Response shapes below are copied 1:1 from
// ai-backend/src/purchasing/purchase-orders.interface.ts and
// ai-backend/src/purchasing/stock-receipts.interface.ts — keep them in sync
// if those files ever change.
//
// Deliberately does NOT duplicate fetchSuppliers or fetchProducts — the
// supplier picker reuses ai-ui/src/domains/suppliers/api/suppliersApi.ts and
// the product picker reuses ai-ui/src/domains/catalog/api/catalogApi.ts
// directly (PRD §2/§4).

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class PurchasingApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'PurchasingApiError';
  }
}

// ── Purchase orders ──────────────────────────────────────────────────────

// PurchaseOrder.status is ALWAYS server-computed (PRD §2) — there is no
// field in either CreatePurchaseOrderDto or CreateStockReceiptDto to set it
// directly. Never add a way to set this from the UI.
export type PurchaseOrderStatus = 'pending' | 'partially_received' | 'received';

export interface PurchaseOrderLine {
  lineId: number;
  purchaseOrderId: number;
  productId: number;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  tenantId: number;
  supplierId: number;
  status: PurchaseOrderStatus;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  lines: PurchaseOrderLine[];
}

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreatePurchaseOrderLineInput {
  productId: number;
  quantityOrdered: number;
  unitCost: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: number;
  expectedDeliveryDate?: string;
  notes?: string;
  lines: CreatePurchaseOrderLineInput[];
}

export interface ListPurchaseOrdersFilter {
  status?: PurchaseOrderStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  per_page?: number;
}

// ── Stock receipts ───────────────────────────────────────────────────────

export interface StockReceiptLine {
  receiptLineId: number;
  receiptId: number;
  purchaseOrderLineId: number;
  productId: number;
  quantityReceived: number;
  batchNumber: string;
  expiryDate: string | null;
  unitCost: number;
  productBatchId: number | null;
  createdAt: string | null;
}

export interface StockReceipt {
  receiptId: number;
  tenantId: number;
  purchaseOrderId: number;
  receivedAt: string | null;
  receivedBy: number | null;
  notes: string | null;
  createdAt: string | null;
  lines: StockReceiptLine[];
}

// A single line's mismatch between what a receipt delivered and what was
// still outstanding at the moment it was processed — informational only,
// never a rejection (PRD §2/STORY-048). Covers both under- and over-receipt.
export interface DiscrepancyEntry {
  purchaseOrderLineId: number;
  productId: number;
  quantityOrdered: number;
  outstandingBeforeReceipt: number;
  quantityReceivedThisReceipt: number;
}

export interface StockReceiptCreateResponse extends StockReceipt {
  discrepancies: DiscrepancyEntry[];
  purchaseOrderStatus: PurchaseOrderStatus;
}

export interface CreateStockReceiptLineInput {
  purchaseOrderLineId: number;
  quantityReceived: number;
  batchNumber: string;
  expiryDate: string;
  unitCost: number;
}

export interface CreateStockReceiptInput {
  notes?: string;
  lines: CreateStockReceiptLineInput[];
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    throw new PurchasingApiError(res.status, `Request failed (${res.status}): ${url}`);
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
    throw new PurchasingApiError(res.status, message);
  }
  return (await res.json()) as T;
}

function buildListQuery(filter: ListPurchaseOrdersFilter): string {
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  params.set('page', String(filter.page ?? 1));
  params.set('per_page', String(filter.per_page ?? 100));
  return params.toString();
}

// GET /tenants/:tenantId/purchase-orders (purchasing:read)
export async function fetchPurchaseOrders(
  tenantId: number,
  filter: ListPurchaseOrdersFilter = {},
  signal?: AbortSignal
): Promise<{ data: PurchaseOrder[]; meta: PaginatedMeta }> {
  return getJson<{ data: PurchaseOrder[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/purchase-orders?${buildListQuery(filter)}`,
    signal
  );
}

// GET /tenants/:tenantId/purchase-orders/:purchaseOrderId (purchasing:read)
export async function fetchPurchaseOrder(
  tenantId: number,
  purchaseOrderId: number,
  signal?: AbortSignal
): Promise<PurchaseOrder> {
  const json = await getJson<{ success: boolean; data: PurchaseOrder }>(
    `${API_BASE}/tenants/${tenantId}/purchase-orders/${purchaseOrderId}`,
    signal
  );
  return json.data;
}

// POST /tenants/:tenantId/purchase-orders (purchasing:create)
export async function createPurchaseOrder(
  tenantId: number,
  input: CreatePurchaseOrderInput
): Promise<PurchaseOrder> {
  const json = await postJson<{ success: boolean; data: PurchaseOrder }>(
    `${API_BASE}/tenants/${tenantId}/purchase-orders`,
    input
  );
  return json.data;
}

// GET /tenants/:tenantId/purchase-orders/:purchaseOrderId/receipts (purchasing:read)
export async function fetchStockReceipts(
  tenantId: number,
  purchaseOrderId: number,
  signal?: AbortSignal
): Promise<{ data: StockReceipt[]; meta: PaginatedMeta }> {
  return getJson<{ data: StockReceipt[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/purchase-orders/${purchaseOrderId}/receipts?per_page=100`,
    signal
  );
}

// POST /tenants/:tenantId/purchase-orders/:purchaseOrderId/receipts
// GOTCHA (PRD §2): permission is `purchasing:update`, NOT `purchasing:create`
// — receiving mutates an existing PO's state, a different permission than
// creating one. Gate callers on `purchasing:update` accordingly.
export async function createStockReceipt(
  tenantId: number,
  purchaseOrderId: number,
  input: CreateStockReceiptInput
): Promise<StockReceiptCreateResponse> {
  const json = await postJson<{ success: boolean; data: StockReceiptCreateResponse }>(
    `${API_BASE}/tenants/${tenantId}/purchase-orders/${purchaseOrderId}/receipts`,
    input
  );
  return json.data;
}
