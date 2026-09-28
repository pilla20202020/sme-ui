// Thin fetch wrappers for STORY-038/STORY-039 (Catalog management UI) —
// mirrors ai-ui/src/domains/reports/api/reportsApi.ts's exact shape
// (credentials: 'include', `${API_BASE}/...`, explicitly-typed envelope
// unwrap). Every endpoint here already existed from Sprint 2 except the
// `search` query param on fetchProducts, added this sprint.

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class CatalogApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'CatalogApiError';
  }
}

export type ProductUnit =
  | 'tablet'
  | 'capsule'
  | 'bottle'
  | 'box'
  | 'strip'
  | 'vial'
  | 'ml'
  | 'each';

export const PRODUCT_UNITS: ProductUnit[] = [
  'tablet',
  'capsule',
  'bottle',
  'box',
  'strip',
  'vial',
  'ml',
  'each',
];

export interface Product {
  productId: number;
  tenantId: number;
  categoryId: number | null;
  name: string;
  sku: string | null;
  unit: ProductUnit;
  currentPrice: number;
  reorderThreshold: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Category {
  categoryId: number;
  tenantId: number;
  name: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductBatch {
  batchId: number;
  tenantId: number;
  productId: number;
  batchNumber: string;
  expiryDate: string | null;
  quantityReceived: number;
  quantityRemaining: number;
  receivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ProductListFilter {
  search?: string;
  categoryId?: number;
  page?: number;
  per_page?: number;
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  unit: ProductUnit;
  categoryId?: number;
  currentPrice: number;
  reorderThreshold?: number;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  unit?: ProductUnit;
  categoryId?: number;
  reorderThreshold?: number;
  isActive?: boolean;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, credentials: 'include' });
  if (!res.ok) {
    throw new CatalogApiError(res.status, `Request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

async function sendJson<T>(
  url: string,
  method: 'POST' | 'PATCH' | 'PUT',
  body: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
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
    throw new CatalogApiError(res.status, message);
  }
  return (await res.json()) as T;
}

function buildProductQuery(filter: ProductListFilter): string {
  const params = new URLSearchParams();
  if (filter.search) params.set('search', filter.search);
  if (filter.categoryId != null) params.set('categoryId', String(filter.categoryId));
  params.set('page', String(filter.page ?? 1));
  params.set('per_page', String(filter.per_page ?? 100));
  return params.toString();
}

// ── Products ─────────────────────────────────────────────────────────────

export async function fetchProducts(
  tenantId: number,
  filter: ProductListFilter,
  signal?: AbortSignal
): Promise<{ data: Product[]; meta: PaginatedMeta }> {
  return getJson<{ data: Product[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/products?${buildProductQuery(filter)}`,
    signal
  );
}

export async function createProduct(tenantId: number, input: CreateProductInput): Promise<Product> {
  const json = await sendJson<{ success: boolean; data: Product }>(
    `${API_BASE}/tenants/${tenantId}/products`,
    'POST',
    input
  );
  return json.data;
}

// Deliberately separate from updateProduct — mirrors the backend's own
// separation between PATCH (general fields) and PUT .../price (which writes
// a ProductPriceHistory row). Never merge these two calls (PRD §3).
export async function updateProduct(
  tenantId: number,
  productId: number,
  input: UpdateProductInput
): Promise<Product> {
  const json = await sendJson<{ success: boolean; data: Product }>(
    `${API_BASE}/tenants/${tenantId}/products/${productId}`,
    'PATCH',
    input
  );
  return json.data;
}

export async function updateProductPrice(
  tenantId: number,
  productId: number,
  price: number
): Promise<Product> {
  const json = await sendJson<{ success: boolean; data: Product }>(
    `${API_BASE}/tenants/${tenantId}/products/${productId}/price`,
    'PUT',
    { price }
  );
  return json.data;
}

// ── Categories ───────────────────────────────────────────────────────────

export async function fetchCategories(
  tenantId: number,
  signal?: AbortSignal
): Promise<{ data: Category[]; meta: PaginatedMeta }> {
  return getJson<{ data: Category[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/categories?per_page=100`,
    signal
  );
}

export async function createCategory(tenantId: number, name: string): Promise<Category> {
  const json = await sendJson<{ success: boolean; data: Category }>(
    `${API_BASE}/tenants/${tenantId}/categories`,
    'POST',
    { name }
  );
  return json.data;
}

// ── Batches (read-only this sprint — no create/edit wrapper here on purpose,
// see PRD §7: batches come exclusively from stock receiving) ──────────────

export async function fetchProductBatches(
  tenantId: number,
  productId: number,
  signal?: AbortSignal
): Promise<{ data: ProductBatch[]; meta: PaginatedMeta }> {
  return getJson<{ data: ProductBatch[]; meta: PaginatedMeta }>(
    `${API_BASE}/tenants/${tenantId}/products/${productId}/batches?per_page=100`,
    signal
  );
}
