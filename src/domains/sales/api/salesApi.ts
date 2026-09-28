// Thin fetch wrappers for STORY-040/STORY-041 (Sales / POS checkout UI) —
// mirrors ai-ui/src/domains/catalog/api/catalogApi.ts's exact shape
// (credentials: 'include', `${API_BASE}/...`, explicitly-typed envelope
// unwrap). Every endpoint here already existed unchanged from Sprint 5
// (checkout) and Sprint 7 (list) — this sprint adds no backend surface.
//
// Response shapes below are copied 1:1 from
// ai-backend/src/sales/sales.interface.ts — keep them in sync if that file
// ever changes.

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class SalesApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'SalesApiError';
  }
}

// ── Request shape (shared by quote + checkout — a quote is a dry-run of the
// same request shape as an actual sale, matching SaleLineItemDto) ─────────

export interface SaleLineItemInput {
  productId: number;
  quantity: number;
}

export interface CreateSaleInput {
  customerId?: number;
  lines: SaleLineItemInput[];
}

// ── STORY-019 quote (read-only, no writes) ────────────────────────────────

export interface QuoteLineResult {
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  available: boolean;
  totalOnHand: number;
}

export interface QuoteResponse {
  lines: QuoteLineResult[];
  subtotal: number;
  total: number;
  allSufficient: boolean;
}

// ── STORY-020/022 checkout + receipt (one shared shape, reused by both) ──

// SPRINT-014 addition (Returns UI backend dependency): a matched return
// needs to name the exact SaleLineBatchAllocation it's reversing, so the
// backend now exposes each line's own id and which batch allocation(s) it
// drew from — additive only, mirrors
// ai-backend/src/sales/sales.interface.ts 1:1. Updated here (not forked
// into a second type) per the PRD's explicit instruction to update this
// shared type and reuse it from the returns domain.
export interface SaleLineAllocationEntry {
  saleLineBatchAllocationId: number;
  quantity: number;
}

export interface SaleLineReceiptEntry {
  saleLineId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  allocations: SaleLineAllocationEntry[];
}

export interface SaleCustomerSummary {
  customerId: number;
  name: string;
}

export interface SaleCashierSummary {
  userId: number;
  firstName: string;
  lastName: string;
}

export interface SaleReceiptResponse {
  saleId: number;
  saleDate: string | null;
  customer: SaleCustomerSummary | null;
  cashier: SaleCashierSummary | null;
  lines: SaleLineReceiptEntry[];
  subtotal: number;
  total: number;
}

// ── STORY-028 sales list (SPRINT-014's returns UI reuses this directly for
// its "look up by Sale ID, or browse recent sales" flow — no second fetch
// built for it, per the PRD) ──────────────────────────────────────────────

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ListSalesFilter {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  per_page?: number;
}

async function sendJson<T>(url: string, body: unknown): Promise<T> {
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
    throw new SalesApiError(res.status, message);
  }
  return (await res.json()) as T;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    throw new SalesApiError(res.status, `Request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

// POST /tenants/:tenantId/sales/quote — read-only dry-run, no writes.
// Call on every cart change (STORY-040 live validation).
export async function quoteSale(
  tenantId: number,
  lines: SaleLineItemInput[]
): Promise<QuoteResponse> {
  const json = await sendJson<{ success: boolean; data: QuoteResponse }>(
    `${API_BASE}/tenants/${tenantId}/sales/quote`,
    { lines }
  );
  return json.data;
}

// POST /tenants/:tenantId/sales — commits the sale atomically (FEFO
// decrement). Can 409 if stock changed since the last quote — callers
// should catch SalesApiError and check `.status === 409`.
export async function checkoutSale(
  tenantId: number,
  input: CreateSaleInput
): Promise<SaleReceiptResponse> {
  const json = await sendJson<{ success: boolean; data: SaleReceiptResponse }>(
    `${API_BASE}/tenants/${tenantId}/sales`,
    input
  );
  return json.data;
}

// GET /tenants/:tenantId/sales/:saleId/receipt
export async function fetchSaleReceipt(
  tenantId: number,
  saleId: number,
  signal?: AbortSignal
): Promise<SaleReceiptResponse> {
  const json = await getJson<{ success: boolean; data: SaleReceiptResponse }>(
    `${API_BASE}/tenants/${tenantId}/sales/${saleId}/receipt`,
    signal
  );
  return json.data;
}

// GET /tenants/:tenantId/sales/:saleId — same shape as the receipt fetch
// above (both reuse the backend's one mapSaleReceipt()); the returns domain
// looks a sale up by this endpoint (there is no dedicated "return lookup"
// endpoint — PRD §2).
export async function fetchSale(
  tenantId: number,
  saleId: number,
  signal?: AbortSignal
): Promise<SaleReceiptResponse> {
  const json = await getJson<{ success: boolean; data: SaleReceiptResponse }>(
    `${API_BASE}/tenants/${tenantId}/sales/${saleId}`,
    signal
  );
  return json.data;
}

// GET /tenants/:tenantId/sales?dateFrom&dateTo (sales:read) — this sprint's
// only consumer is the returns domain's "browse recent sales" fallback (PRD
// §2/§3: no customer search exists, so a Sale ID lookup or this list are the
// only two ways to find an original sale). Paginated the same
// { data, meta } shape every other list endpoint in this codebase uses.
export async function fetchSales(
  tenantId: number,
  filter: ListSalesFilter = {},
  signal?: AbortSignal
): Promise<{ data: SaleReceiptResponse[]; meta: PaginatedMeta }> {
  const params = new URLSearchParams();
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  params.set('page', String(filter.page ?? 1));
  params.set('per_page', String(filter.per_page ?? 50));
  return getJson<{ data: SaleReceiptResponse[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/sales?${params.toString()}`,
    signal
  );
}
