import { z } from 'zod';

// ── Environment

const API_BASE_V1 = import.meta.env.VITE_API_BASE_URL_V1;
if (!API_BASE_V1) throw new Error('Failed to configure API endpoint');

// ── Schemas

const EmailStatusSchema = z.enum([
  'sent',
  'failed',
  'bounced',
  'pending',
  'invalid',
  'opened',
  'queued',
  'delivered',
]);

const ApiEmailLogSchema = z.object({
  id: z.string(),
  enrollmentId: z.string(),
  msgCenterEmailLogId: z.number(),
  subject: z.string(),
  sentAt: z.string(),
  to: z.string(),
  cc: z.string().nullable(),
  bcc: z.string().nullable(),
  emailStatus: EmailStatusSchema,
});

const EmailLogsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ApiEmailLogSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    per_page: z.number(),
    total_pages: z.number(),
  }),
});

// ── Inferred types

export type EmailStatus = z.infer<typeof EmailStatusSchema>;
export type ApiEmailLog = z.infer<typeof ApiEmailLogSchema>;
export type EmailLogsResponse = z.infer<typeof EmailLogsResponseSchema>;

export interface EmailLogsParams {
  enrollment_id: string;
  subject?: string;
  sent_date_from?: string;
  sent_date_to?: string;
  recipient?: string;
  email_status?: EmailStatus;
  page?: number;
  per_page?: number;
}

// ── Auth helper

function bearerHeaders(): HeadersInit {
  const token = sessionStorage.getItem('uw_access_token') ?? '';
  return { Authorization: `Bearer ${token}` };
}

// ── Fetch

export async function fetchEmailLogContent(
  id: string,
  signal?: AbortSignal
): Promise<{ previewContent: string | null }> {
  const res = await fetch(`${API_BASE_V1}/email-logs/${btoa(id)}/content`, {
    signal,
    credentials: 'include',
    headers: bearerHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch email content (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { success: boolean; data: { previewContent: string | null } };
  return json.data;
}

export async function sendQuestionnaireReminder(enrollmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE_V1}/email-logs/questionnaire-reminder`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders() },
    body: JSON.stringify({ enrollment_id: btoa(enrollmentId) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send questionnaire reminder (${res.status}): ${text}`);
  }
}

export async function sendSignatureReminder(enrollmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE_V1}/email-logs/signature-reminder`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders() },
    body: JSON.stringify({ enrollment_id: btoa(enrollmentId) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send signature reminder (${res.status}): ${text}`);
  }
}

export async function resendEmailLog(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_V1}/email-logs/${btoa(id)}/resend`, {
    method: 'GET',
    credentials: 'include',
    headers: bearerHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to resend email (${res.status}): ${text}`);
  }
}

export async function forwardEmailLog(id: string, email: string): Promise<void> {
  const res = await fetch(`${API_BASE_V1}/email-logs/${btoa(id)}/forward`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders() },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to forward email (${res.status}): ${text}`);
  }
}

export async function fetchEmailLogs(
  params: EmailLogsParams,
  signal?: AbortSignal
): Promise<EmailLogsResponse> {
  const qs = new URLSearchParams();
  qs.set('enrollment_id', btoa(params.enrollment_id));
  if (params.subject) qs.set('subject', params.subject);
  if (params.sent_date_from) qs.set('sent_date_from', params.sent_date_from);
  if (params.sent_date_to) qs.set('sent_date_to', params.sent_date_to);
  if (params.recipient) qs.set('recipient', params.recipient);
  if (params.email_status) qs.set('email_status', params.email_status);
  qs.set('page', String(params.page ?? 1));
  qs.set('per_page', String(params.per_page ?? 10));

  const res = await fetch(`${API_BASE_V1}/email-logs?${qs}`, {
    signal,
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch email logs (${res.status}): ${errorText}`);
  }

  return EmailLogsResponseSchema.parse(await res.json());
}
