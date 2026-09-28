import { z } from 'zod';

const API_BASE_V1 = import.meta.env.VITE_API_BASE_URL_V1;
if (!API_BASE_V1) throw new Error('Failed to configure API endpoint');

const PlanPricingSchema = z.object({
  planPricingId: z.number(),
  price: z.number(),
  pricingType: z.string().nullable(),
});

export const PlanSelectionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  premium: z.number(),
  tier: z.string().nullable(),
  carrier: z.string().nullable(),
  planPricings: z.array(PlanPricingSchema).optional(),
});

const AssociationPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  premium: z.number(),
  tier: z.string().nullable(),
});

// The API sends payment totals as numeric strings (e.g. "123.45") rather than numbers.
const NullableNumberish = z
  .union([z.number(), z.string()])
  .nullable()
  .transform((v) => (v == null ? null : Number(v)));

const AvailablePlanSchema = PlanSelectionPlanSchema.extend({
  planPricings: z.array(PlanPricingSchema),
});

export const PlanSelectionDataSchema = z.object({
  policyId: z.number(),
  status: z.string(),
  member: z
    .object({
      name: z.string(),
      initials: z.string(),
      phone: z.string().nullable(),
      email: z.string(),
      age: z.string().nullable(),
      employerGroup: z.string(),
    })
    .nullable(),
  enrollment: z.object({
    number: z.string(),
    enrollmentDate: z.string(),
    effectiveDate: z.string().nullable(),
    group: z.string(),
    address: z.string().nullable(),
    associations: z.array(AssociationPlanSchema).nullable(),
    payment: z
      .object({
        enrollmentFee: NullableNumberish,
        firstMonthTotal: NullableNumberish,
        recurringMonthTotal: NullableNumberish,
      })
      .nullable(),
  }),
  representative: z
    .object({
      name: z.string(),
      email: z.string(),
    })
    .nullable(),
  currentPlanId: z.string().nullable(),
  currentPlanPricingId: z.number().nullable(),
  selectedPlan: PlanSelectionPlanSchema.nullable(),
  availablePlans: z.array(AvailablePlanSchema),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlanSelectionData = z.infer<typeof PlanSelectionDataSchema>;

// ── Submit payload ────────────────────────────────────────────────────────────

export interface SubmitPlanSelectionPayload {
  policyId: number;
  selectedPlanId: string;
  effectiveDate: string;
  signatureData?: string | null;
  // Required when the selected plan differs from the current plan
  currentPlanId?: number;
  planId?: number;
  planPricingId?: number;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchPlanSelectionData(id: number): Promise<PlanSelectionData> {
  const res = await fetch(`${API_BASE_V1}/plan-selection/enrollment?id=${id}`);

  if (res.status === 404) throw new Error('invalid_token');
  if (res.status === 410) throw new Error('token_expired');
  if (!res.ok) throw new Error(`Failed to load enrollment data (${res.status})`);

  const raw = await res.json();
  return PlanSelectionDataSchema.parse(raw.data);
}

// ── Submit ────────────────────────────────────────────────────────────────────

export async function submitPlanSelection(
  payload: SubmitPlanSelectionPayload
): Promise<{ success: boolean; policyId: number }> {
  const res = await fetch(`${API_BASE_V1}/plan-selection/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Submission failed (${res.status})`);
  }

  return res.json() as Promise<{ success: boolean; policyId: number }>;
}

// ── Member portal (token-authenticated) variants ──────────────────────────────

export async function fetchMemberPlanSelectionData(
  accessToken: string
): Promise<PlanSelectionData> {
  const res = await fetch(`${API_BASE_V1}/member/signature/plan-selection`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 410) throw new Error('token_expired');
  if (!res.ok) throw new Error(`Failed to load enrollment data (${res.status})`);

  const raw = await res.json();
  return PlanSelectionDataSchema.parse(raw.data);
}

export interface MemberSubmitPlanSelectionPayload {
  selectedPlanId: string;
  effectiveDate: string;
  signatureData?: string | null;
}

export async function submitMemberPlanSelection(
  payload: MemberSubmitPlanSelectionPayload,
  accessToken: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_V1}/member/signature/plan-selection/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Submission failed (${res.status})`);
  }

  return res.json() as Promise<{ success: boolean }>;
}
