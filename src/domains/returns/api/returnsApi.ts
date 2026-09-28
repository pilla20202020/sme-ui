// Thin fetch wrappers for STORY-052/STORY-053 (Returns UI, EPIC-007) —
// mirrors ai-ui/src/domains/sales/api/salesApi.ts's exact shape
// (credentials: 'include', `${API_BASE}/...`, explicitly-typed envelope
// unwrap, no `any`).
//
// Response shape below is copied 1:1 from
// ai-backend/src/returns/returns.interface.ts — keep in sync if it changes.
// There is deliberately no fetchReturns()/list wrapper here — no list
// endpoint exists on the backend (only GET .../:returnId), so this domain
// does not build a "browse all returns" screen (PRD §5 explicit deferral).
// There is also no fetchReturn(returnId) — POST /returns' own response
// already carries everything the confirmation view needs (PRD §3 AC:
// "reuse whatever response shape POST /returns returns").

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class ReturnsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ReturnsApiError';
  }
}

export interface ReturnLineResponseEntry {
  returnLineId: number;
  productId: number;
  productName: string;
  saleLineBatchAllocationId: number | null;
  productBatchId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReturnResponse {
  returnId: number;
  tenantId: number;
  saleId: number | null;
  reason: string;
  overrideApprovedBy: number | null;
  processedBy: number | null;
  refundTotal: number;
  returnDate: string | null;
  lines: ReturnLineResponseEntry[];
}

// Matched case (STORY-052): saleId present, each line names an existing
// sale's own SaleLineBatchAllocation — the id STORY-052's sale-lookup step
// exists specifically to surface (via the sales domain's saleLineId/
// allocations fields, this sprint's backend addition).
export interface MatchedReturnLineInput {
  saleLineBatchAllocationId: number;
  quantity: number;
}

export interface CreateMatchedReturnInput {
  saleId: number;
  reason: string;
  lines: MatchedReturnLineInput[];
}

// Override case (STORY-053): saleId is OMITTED entirely (never sent as null
// or 0 — its absence is what selects this branch server-side, PRD §2/§5). A
// named overrideApprovedBy with returns:override is required and asserted
// in-service (403 if missing/unauthorized) — not something the frontend can
// gate structurally beyond requiring the field.
export interface OverrideReturnLineInput {
  productId: number;
  productBatchId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateOverrideReturnInput {
  reason: string;
  overrideApprovedBy: number;
  lines: OverrideReturnLineInput[];
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
    throw new ReturnsApiError(res.status, message);
  }
  return (await res.json()) as T;
}

// POST /tenants/:tenantId/returns (returns:create, plus the in-service
// returns:override check for the unmatched branch) — one endpoint, two
// request shapes; the caller picks which by whether `saleId` is present at
// all (PRD §2).
export async function createReturn(
  tenantId: number,
  input: CreateMatchedReturnInput | CreateOverrideReturnInput
): Promise<ReturnResponse> {
  const json = await postJson<{ success: boolean; data: ReturnResponse }>(
    `${API_BASE}/tenants/${tenantId}/returns`,
    input
  );
  return json.data;
}
