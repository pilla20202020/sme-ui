const API_BASE_V1 = import.meta.env.VITE_API_BASE_URL_V1;
if (!API_BASE_V1) throw new Error('Failed to configure API endpoint');

// ── Dashboard summary ─────────────────────────────────────────────────────────

export interface DashboardCounts {
  total: number;
  pending_underwriting: number;
  active: number;
  declined_by_uw: number;
  declined_by_member: number;
  [key: string]: number;
}

export interface DashboardActivity {
  policyId: string;
  actor: string;
  actorType: 'admin' | 'member' | 'system';
  action: string;
  performedAt: string;
  status: string;
}

export interface DashboardRecentEnrollment {
  policyId: string;
  status: string;
  enrollDate: string;
  effectiveDate: string;
  memberInfo: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  plan: {
    pid: string;
    planName: string;
    premium: string;
    tier: string | null;
  } | null;
}

export interface DashboardRejectionBreakdown {
  declined_by_uw: number;
  declined_by_member: number;
}

export interface DashboardAttentionQueue {
  overdueReviews: number;
  unansweredQuestions: number;
  bouncedEmails: number;
}

export interface DashboardWeeklyEnrollments {
  approved: number;
  rejected: number;
  labels: string[];
  approvedByDay: number[];
  rejectedByDay: number[];
}

export interface DashboardSummary {
  counts: DashboardCounts;
  recentEnrollments: DashboardRecentEnrollment[];
  recentActivity: DashboardActivity[];
  rejectionBreakdown: DashboardRejectionBreakdown;
  attentionQueue: DashboardAttentionQueue;
  weeklyEnrollments?: DashboardWeeklyEnrollments;
}

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE_V1}/dashboard`, { signal, credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch dashboard (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { success: boolean; data: DashboardSummary };
  return json.data;
}

// ── Pipeline chart ────────────────────────────────────────────────────────────

export type Timeframe = 'weekly' | 'monthly' | 'yearly';

export interface PipelineStatsSeries {
  name: string;
  data: number[];
}

export interface PipelineStatsResponse {
  labels: string[];
  series: PipelineStatsSeries[];
}

export async function fetchPipelineStats(
  timeframe: Timeframe,
  signal?: AbortSignal,
  year?: number,
  startDate?: string
): Promise<PipelineStatsResponse> {
  const qs = new URLSearchParams({ timeframe });
  if (year !== undefined) qs.set('year', String(year));
  if (startDate !== undefined) qs.set('startDate', startDate);
  const res = await fetch(`${API_BASE_V1}/dashboard/pipeline-stats?${qs}`, {
    signal,
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch pipeline stats (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { success: boolean; data: PipelineStatsResponse };
  return json.data;
}
