// Thin fetch wrappers for STORY-049/STORY-050/STORY-051 (Inventory Management
// UI, EPIC-005) — mirrors ai-ui/src/domains/purchasing/api/purchasingApi.ts's
// exact shape (credentials: 'include', `${API_BASE}/...`, explicitly-typed
// envelope unwrap). Every endpoint here already existed unchanged from
// Sprint 4 (STORY-015..018) — this sprint adds no backend surface (PRD §2).
//
// Response shapes below are copied 1:1 from
// ai-backend/src/inventory/inventory-movements.interface.ts and
// ai-backend/src/inventory/inventory-alerts.interface.ts — keep them in sync
// if those files ever change.
//
// GOTCHA verified by reading ai-backend/src/common/interceptors/
// transform.interceptor.ts directly: every response is wrapped in
// { success, data } (plus `meta` when the handler already returned a
// { data, meta } paginated shape). The paginated endpoints below (movements,
// low-stock, near-expiry) therefore already match { data, meta } once
// decoded — same tolerance catalogApi.ts/purchasingApi.ts rely on for their
// own paginated fetches, `success` just goes unused. The two single-object
// endpoints (on-hand, adjustments) are NOT paginated, so they get wrapped as
// { success, data: <object> } and must be unwrapped via `.data`, same as
// purchasingApi.ts's fetchPurchaseOrder/createPurchaseOrder.
//
// Deliberately does NOT duplicate fetchProducts — the adjustment form's
// product picker reuses ai-ui/src/domains/catalog/api/catalogApi.ts directly
// (PRD §2/§4).

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class InventoryApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'InventoryApiError';
  }
}

// Keep in sync with the `InventoryMovementType` enum in
// ai-backend/prisma/schema.prisma. `sale`/`return` are reserved for
// EPIC-006/EPIC-007 — this domain never writes them, only displays them if
// present (PRD §6: read-only for all movement types in this ledger).
export type InventoryMovementType = 'receipt' | 'adjustment' | 'sale' | 'return';

export interface InventoryMovement {
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

export interface OnHandBatchEntry {
  batchId: number;
  batchNumber: string;
  expiryDate: string | null;
  quantityRemaining: number;
}

export interface OnHandResponse {
  productId: number;
  totalOnHand: number;
  batches: OnHandBatchEntry[];
}

export interface InventoryAdjustmentResponse {
  movement: InventoryMovement;
  quantityRemaining: number;
}

export interface LowStockAlertEntry {
  productId: number;
  name: string;
  sku: string | null;
  reorderThreshold: number;
  totalOnHand: number;
}

export interface NearExpiryAlertEntry {
  batchId: number;
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: string | null;
  quantityRemaining: number;
  daysUntilExpiry: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ListMovementsFilter {
  productId?: number;
  movementType?: InventoryMovementType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  per_page?: number;
}

// productBatchId/quantityDelta/reason — quantityDelta is validated non-zero
// server-side (`NotEquals(0)`) and reason non-empty-after-trim; this domain
// blocks both client-side too (PRD §2 hard requirement), never relying on
// the raw 400 to surface first.
export interface CreateAdjustmentInput {
  productBatchId: number;
  quantityDelta: number;
  reason: string;
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
    throw new InventoryApiError(res.status, message);
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
    throw new InventoryApiError(res.status, message);
  }
  return (await res.json()) as T;
}

function buildMovementsQuery(filter: ListMovementsFilter): string {
  const params = new URLSearchParams();
  if (filter.productId != null) params.set('productId', String(filter.productId));
  if (filter.movementType) params.set('movementType', filter.movementType);
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  params.set('page', String(filter.page ?? 1));
  // Max the page size the backend allows (PaginationQueryDto caps per_page at
  // 100) and let DataTable's own client-side pagination handle sub-paging —
  // same convention fetchSuppliers/fetchStockReceipts/fetchProducts follow
  // elsewhere in this project.
  params.set('per_page', String(filter.per_page ?? 100));
  return params.toString();
}

// GET /tenants/:tenantId/inventory/movements (inventory:read) — tenant-wide
// ledger, default sort occurredAt desc (server-side, never re-sorted here).
export async function fetchMovements(
  tenantId: number,
  filter: ListMovementsFilter = {},
  signal?: AbortSignal
): Promise<{ data: InventoryMovement[]; meta: PaginatedMeta }> {
  return getJson<{ data: InventoryMovement[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/inventory/movements?${buildMovementsQuery(filter)}`,
    signal
  );
}

// GET /tenants/:tenantId/products/:productId/inventory/on-hand
// (inventory:read) — NOT paginated, so unwrap `.data` (see file header).
export async function fetchOnHand(
  tenantId: number,
  productId: number,
  signal?: AbortSignal
): Promise<OnHandResponse> {
  const json = await getJson<{ success: boolean; data: OnHandResponse }>(
    `${API_BASE}/tenants/${tenantId}/products/${productId}/inventory/on-hand`,
    signal
  );
  return json.data;
}

// POST /tenants/:tenantId/products/:productId/inventory/adjustments
// GOTCHA (PRD §2): permission is `inventory:adjust`, a STRICTER, separate
// permission than the read screens' `inventory:read` — per Sprint 4 seed
// grants, inventory_staff/manager/owner have both, accountant/cashier have
// neither. Never gate a caller of this on `inventory:read` alone.
export async function createAdjustment(
  tenantId: number,
  productId: number,
  input: CreateAdjustmentInput
): Promise<InventoryAdjustmentResponse> {
  const json = await postJson<{ success: boolean; data: InventoryAdjustmentResponse }>(
    `${API_BASE}/tenants/${tenantId}/products/${productId}/inventory/adjustments`,
    input
  );
  return json.data;
}

// GET /tenants/:tenantId/inventory/alerts/low-stock (inventory:read) —
// already sorted worst-shortage-first by the backend; never re-sort
// client-side (PRD §5 AC).
export async function fetchLowStockAlerts(
  tenantId: number,
  filter: { page?: number; per_page?: number } = {},
  signal?: AbortSignal
): Promise<{ data: LowStockAlertEntry[]; meta: PaginatedMeta }> {
  const params = new URLSearchParams();
  params.set('page', String(filter.page ?? 1));
  params.set('per_page', String(filter.per_page ?? 100));
  return getJson<{ data: LowStockAlertEntry[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/inventory/alerts/low-stock?${params.toString()}`,
    signal
  );
}

// GET /tenants/:tenantId/inventory/alerts/near-expiry?withinDays= (default
// 30, inventory:read) — already includes already-expired batches, sorted
// soonest-first by the backend; never re-sort client-side (PRD §5 AC).
export async function fetchNearExpiryAlerts(
  tenantId: number,
  withinDays: number,
  filter: { page?: number; per_page?: number } = {},
  signal?: AbortSignal
): Promise<{ data: NearExpiryAlertEntry[]; meta: PaginatedMeta }> {
  const params = new URLSearchParams();
  params.set('withinDays', String(withinDays));
  params.set('page', String(filter.page ?? 1));
  params.set('per_page', String(filter.per_page ?? 100));
  return getJson<{ data: NearExpiryAlertEntry[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/inventory/alerts/near-expiry?${params.toString()}`,
    signal
  );
}
