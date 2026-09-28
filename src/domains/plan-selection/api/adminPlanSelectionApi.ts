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

export type PlanSelectionPlan = z.infer<typeof PlanSelectionPlanSchema>;

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

export type AvailablePlan = z.infer<typeof AvailablePlanSchema>;

export const AdminPlanSelectionDataSchema = z.object({
  policyId: z.number(),
  status: z.string(),
  signatureReceivedAt: z.string().nullable(),
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
  currentPlanId: z.string(),
  currentPlanPricingId: z.number().nullable(),
  selectedPlan: PlanSelectionPlanSchema.nullable(),
  availablePlans: z.array(AvailablePlanSchema),
});

export type AdminPlanSelectionData = z.infer<typeof AdminPlanSelectionDataSchema>;

export async function fetchAdminPlanSelectionData(id: number): Promise<AdminPlanSelectionData> {
  const res = await fetch(`${API_BASE_V1}/plan-selection/admin/enrollment?id=${id}`, {
    credentials: 'include',
  });

  if (res.status === 401) throw new Error('unauthorized');
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error(`Failed to load enrollment data (${res.status})`);

  const raw = await res.json();
  const parsed = AdminPlanSelectionDataSchema.safeParse(raw.data);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  [${issue.path.join('.')}] ${issue.message}`)
      .join('\n');
    console.error(`AdminPlanSelectionData validation failed:\n${details}`, raw.data);
    throw new Error('Failed to parse enrollment data');
  }
  return parsed.data;
}
