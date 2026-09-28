import { z } from 'zod';
import type { Enrollment } from '@/domains/enrollments/types';
import type { Plan } from '@/shared/constants';
import {
  API_STATUSES,
  API_TO_UI_STATUS,
  UI_TO_API_STATUS,
  type ApiStatus,
} from '@/shared/constants';
export type { ApiStatus } from '@/shared/constants';
export { UI_TO_API_STATUS };

// ── Environment ──────────────────────────────────────────────────────────────

const API_BASE_V1 = import.meta.env.VITE_API_BASE_URL_V1;
if (!API_BASE_V1) throw new Error('Failed to configure API endpoint');

// ── Zod schemas (runtime validation) ─────────────────────────────────────────

const ApiEnrollmentItemSchema = z.object({
  sysId: z.number(),
  policyId: z.string(),
  status: z.enum(API_STATUSES),
  enrollDate: z.string(),
  effectiveDate: z.string().nullable(),
  contractDownloadUrl: z.string().nullish(),
  hasUnreadQuestionAnswers: z.boolean().optional().default(false),
  isPresent: z.boolean().optional().default(false),
  recommendation: z.string().nullish(),
  rejectionReason: z.string().nullish(),
  approvedPolicyIds: z.array(z.string()).optional().default([]),
  notApprovedPolicyIds: z.array(z.string()).optional().default([]),
  member: z.object({
    userId: z.string(),
    name: z.string(),
    firstName: z.string(),
    middleName: z.string().nullish(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    address: z.string(),
  }),
  agent: z.object({
    agentId: z.string(),
    name: z.string(),
    repCode: z.string(),
  }),
  plan: z
    .object({
      pid: z.string(),
      planName: z.string(),
      premium: z.number(),
      tier: z.string().nullable(),
      isRemoved: z.boolean().optional().default(false),
    })
    .nullable(),
  selectedPlanIds: z.array(z.string()).optional().default([]),
  group: z.object({
    groupId: z.string(),
    name: z.string(),
    groupType: z.string(),
  }),
  enrollment_plans: z
    .array(
      z.object({
        pid: z.string(),
        planName: z.string(),
        premium: z.number(),
        tier: z.string().nullable(),
        carrier: z.string().nullish(),
      })
    )
    .optional()
    .default([]),
  notes: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        addedAt: z.string(),
        addedBy: z
          .object({
            userId: z.number(),
            name: z.string(),
          })
          .optional(),
      })
    )
    .optional()
    .default([]),
});

const ApiMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
  counts: z.record(z.string(), z.number()),
});

const ApiEnrollmentsResponseSchema = z.object({
  data: z.array(ApiEnrollmentItemSchema),
  meta: ApiMetaSchema,
});

// ── Inferred types (from schemas) ─────────────────────────────────────────────

export type ApiEnrollmentItem = z.infer<typeof ApiEnrollmentItemSchema>;
export type ApiMeta = z.infer<typeof ApiMetaSchema>;
export type ApiEnrollmentsResponse = z.infer<typeof ApiEnrollmentsResponseSchema>;

// ── Count mapping ─────────────────────────────────────────────────────────────

export function mapApiCounts(apiCounts: Record<string, number>): Record<string, number> {
  return {
    All: apiCounts.all ?? 0,
    'Pending Underwriting': apiCounts.pending_underwriting ?? 0,
    'Pending Response': apiCounts.pending_response ?? 0,
    'Pending Signature': apiCounts.pending_signature ?? 0,
    'Ready to Activate': apiCounts.ready_to_activate ?? 0,
    Active: apiCounts.active ?? 0,
    'Declined by UW': apiCounts.declined_by_uw ?? 0,
    'Declined by Member': apiCounts.declined_by_member ?? 0,
    Termed: apiCounts.termed ?? 0,
  };
}

// ── Mapper ────────────────────────────────────────────────────────────────────

export function mapApiItemToEnrollment(item: ApiEnrollmentItem): Enrollment {
  // Best-effort name split — prefer dedicated firstName/lastName API fields when available
  const parts = item.member.name.trim().split(' ');
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');

  return {
    id: item.sysId,
    key: item.policyId,
    policyId: item.policyId,
    userId: item.member.userId,
    status: API_TO_UI_STATUS[item.status] ?? 'Pending Underwriting',
    firstName,
    lastName,
    name: item.member.name,
    email: item.member.email,
    phone: item.member.phone ?? '',
    gender: '',
    dob: '',
    age: 0,
    ssn: '',
    height: '',
    weight: '',
    address: item.member.address,
    agentId: item.agent.agentId,
    agentName: item.agent.name,
    agentRepCode: item.agent.repCode,
    groupId: item.group?.groupId ?? '',
    groupName: item.group?.name ?? '',
    groupType: item.group?.groupType ?? '',
    enrollDate: item.enrollDate,
    effectiveDate: item.effectiveDate ?? '',
    plan: item.plan
      ? {
          id: item.plan.pid,
          name: item.plan.planName,
          premium: item.plan.premium,
          tier: item.plan.tier ?? '',
          isRemoved: item.plan.isRemoved,
        }
      : null,
    planId: item.plan?.pid ?? '',
    planName: item.plan?.planName ?? '',
    premium: item.plan?.premium ?? 0,
    tier: item.plan?.tier ?? '',
    recommendation: item.recommendation?.toLowerCase() === 'yes' ? 'Yes' : 'No',
    recommendationText: item.recommendation ?? null,
    approvedPolicyIds: item.approvedPolicyIds,
    notApprovedPolicyIds: item.notApprovedPolicyIds,
    answeredQuestions: item.hasUnreadQuestionAnswers,
    invoicePaid: false,
    riskFlag: null,
    paymentMethod: '',
    recurringMethod: '',
    phqAnswers: [],
    dependents: [],
    emailLogs: [],
    enrollmentPlans: item.enrollment_plans.map(
      (p): Plan => ({
        id: p.pid,
        name: p.planName,
        premium: p.premium,
        tier: p.tier ?? '',
        carrier: p.carrier ?? undefined,
      })
    ),
    selectedPlanIds: item.selectedPlanIds,
    notes: item.notes.map((n) => ({
      text: n.text,
      author: n.addedBy?.name ?? '',
      date: n.addedAt,
    })),
    activities: [],
    rejectionReason: item.rejectionReason ?? null,
    browser: '',
    ipAddress: '',
    enrollmentTimestamp: '',
    contractDownloadUrl: item.contractDownloadUrl ?? null,
  };
}

// ── Approve ───────────────────────────────────────────────────────────────────

export interface ApproveEnrollmentPayload {
  policyId: number;
  planIds: string[];
  tier: string;
}

export async function approveEnrollment(payload: ApproveEnrollmentPayload): Promise<void> {
  const res = await fetch(`${API_BASE_V1}/enrollments/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to approve enrollment (${res.status}): ${errorText}`);
  }
}

// ── Edit plan (pending_signature) ────────────────────────────────────────────

export async function editPlanSelection(payload: ApproveEnrollmentPayload): Promise<void> {
  const res = await fetch(`${API_BASE_V1}/enrollments/edit-plan`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to edit plan selection (${res.status}): ${errorText}`);
  }
}

// ── Change status ─────────────────────────────────────────────────────────────

export type EnrollmentAction =
  | 'APPROVE'
  | 'ASK_QUESTION'
  | 'ANSWER_QUESTION'
  | 'SIGN_RECEIVED'
  | 'ACTIVATE'
  | 'REJECT'
  | 'REVERT'
  | 'DECLINE_BY_MEMBER';

export async function changeEnrollmentStatus(
  policyId: string,
  action: EnrollmentAction,
  rejectionReason?: string
): Promise<void> {
  const res = await fetch(`${API_BASE_V1}/enrollments/change-status`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      policyId: Number(policyId),
      newStatus: action,
      ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
    }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to change enrollment status (${res.status}): ${errorText}`);
  }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchEnrollments(
  params: {
    status?: ApiStatus;
    page?: number;
    per_page?: number;
  } = {},
  signal?: AbortSignal
): Promise<ApiEnrollmentsResponse> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    per_page: String(params.per_page ?? 100),
  });
  if (params.status) qs.set('status', params.status);

  const res = await fetch(`${API_BASE_V1}/enrollments?${qs}`, { signal, credentials: 'include' });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch enrollments (${res.status}): ${errorText}`);
  }

  const raw = await res.json();
  return ApiEnrollmentsResponseSchema.parse(raw);
}
