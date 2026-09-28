import { z } from 'zod';
import type { Plan } from '@/shared/constants';

const API_BASE_V1 = import.meta.env.VITE_API_BASE_URL_V1;
if (!API_BASE_V1) throw new Error('Failed to configure API endpoint');

const L713PlanDtoSchema = z.object({
  pl_id: z.number(),
  plan_name: z.string(),
  plan_price: z.string().nullable(),
  plan_tier: z.string().nullable(),
  plan_category: z.string().nullable(),
  plan_carrier: z.string().nullable(),
});

const L713PlansResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.object({
    status: z.string().optional(),
    statusCode: z.number().optional(),
    message: z.string().optional(),
    data: z.array(L713PlanDtoSchema),
  }),
});

function mapDtoToPlan(dto: z.infer<typeof L713PlanDtoSchema>) {
  return {
    id: String(dto.pl_id),
    name: dto.plan_name,
    premium: dto.plan_price ?? 0,
    tier: dto.plan_tier,
    category: dto.plan_category,
    carrier: dto.plan_carrier,
  };
}

export async function fetchL713Plans(policyId: string, signal?: AbortSignal): Promise<Plan[]> {
  const params = new URLSearchParams({ policyId });
  const res = await fetch(`${API_BASE_V1}/enrollments/l713-plans?${params}`, {
    signal,
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch L713 plans (${res.status}): ${text}`);
  }
  const raw = await res.json();
  const result = L713PlansResponseSchema.safeParse(raw);
  if (!result.success) {
    console.error('Zod parse failed:', JSON.stringify(result.error.format(), null, 2));
    throw result.error;
  }
  return result.data.data.data.map(mapDtoToPlan) as Plan[];
}
