import type {
  SendQuestionsResponse,
  QuestionLogItem,
  ValidateAccessResponse,
  VerifyOtpResponse,
  PendingQuestionsData,
  AnswerItem,
  SubmitAnswersResponse,
  DeclineDetails,
} from '@/domains/member-questions/types';

export class DeclineApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function parseDeclineErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as {
      message?: string;
      errors?: { field: string; messages: string[] }[];
    };
    if (body?.errors?.length) return body.errors[0].messages[0];
    if (body?.message) return body.message;
  } catch {
    // no JSON body — fall back to the default message
  }
  return fallback;
}

// Environment
const API_BASE_V1 = import.meta.env.VITE_API_BASE_URL_V1 as string;
if (!API_BASE_V1) throw new Error('Failed to configure API endpoint');

const ADMIN_ENROLLMENTS_BASE = `${API_BASE_V1}/enrollments`;
const MEMBER_BASE = `${API_BASE_V1}/member/questions`;

const MEMBER_SIGNATURE_BASE = `${API_BASE_V1}/member/signature`;

// Backend wraps all responses in { success, data } — unwrap the payload
async function unwrap<T>(res: Response): Promise<T> {
  const json = (await res.json()) as { success: boolean; data: T } | T;
  return json !== null && typeof json === 'object' && 'data' in json
    ? (json as { success: boolean; data: T }).data
    : (json as T);
}

// Admin: Send questions
export async function sendQuestionsApi(
  policyId: string,
  questions: string[]
): Promise<SendQuestionsResponse> {
  const res = await fetch(`${ADMIN_ENROLLMENTS_BASE}/${policyId}/questions`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send questions (${res.status}): ${text}`);
  }
  return unwrap<SendQuestionsResponse>(res);
}

// Admin: Fetch Q&A log
export async function fetchQuestionLogApi(policyId: string): Promise<QuestionLogItem[]> {
  const res = await fetch(`${ADMIN_ENROLLMENTS_BASE}/${policyId}/questions`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch question log (${res.status}): ${text}`);
  }
  return unwrap<QuestionLogItem[]>(res);
}

// Member portal: Validate access link JWT
export async function validateAccessApi(token: string): Promise<ValidateAccessResponse> {
  const res = await fetch(`${MEMBER_BASE}/access?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    throw new Error('Invalid or expired access token');
  }
  return unwrap<ValidateAccessResponse>(res);
}

// Member portal: Send OTP
export async function sendOtpApi(token: string): Promise<{ message: string }> {
  const res = await fetch(`${MEMBER_BASE}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send OTP (${res.status}): ${text}`);
  }
  return unwrap<{ message: string }>(res);
}

// Member portal: Verify OTP
export async function verifyOtpApi(token: string, otp: string): Promise<VerifyOtpResponse> {
  const res = await fetch(`${MEMBER_BASE}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, otp }),
  });
  if (!res.ok) {
    throw new Error('Invalid or expired OTP');
  }
  return unwrap<VerifyOtpResponse>(res);
}

// Member portal: Fetch pending questions
export async function fetchPendingQuestionsApi(accessToken: string): Promise<PendingQuestionsData> {
  const res = await fetch(MEMBER_BASE, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Session expired or unauthorized');
  }
  return unwrap<PendingQuestionsData>(res);
}

export async function getDeclineDetailsApi(accessToken: string): Promise<DeclineDetails> {
  const res = await fetch(`${MEMBER_SIGNATURE_BASE}/decline-details`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new DeclineApiError(
      res.status,
      await parseDeclineErrorMessage(res, 'Invalid or expired session')
    );
  }
  return unwrap<DeclineDetails>(res);
}

export async function declineApi(accessToken: string, reason: string): Promise<void> {
  const res = await fetch(`${MEMBER_SIGNATURE_BASE}/decline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    throw new DeclineApiError(
      res.status,
      await parseDeclineErrorMessage(res, 'Failed to decline enrollment')
    );
  }
}

// Member portal: Submit answers
export async function submitAnswersApi(
  accessToken: string,
  answers: AnswerItem[]
): Promise<SubmitAnswersResponse> {
  const res = await fetch(`${MEMBER_BASE}/answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to submit answers (${res.status}): ${text}`);
  }
  return unwrap<SubmitAnswersResponse>(res);
}
