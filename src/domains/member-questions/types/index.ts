// ── Admin Q&A types ───────────────────────────────────────────────────────────

export interface SendQuestionsResponse {
  threadId: string;
  questionCount: number;
  memberLink: string;
}

export interface QuestionLogItem {
  id: string;
  question: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED';
  askedBy: string;
  sentAt: string;
  respondedAt: string | null;
}

// ── Member portal types ───────────────────────────────────────────────────────

export interface ValidateAccessResponse {
  valid: boolean;
  email: string;
  action?: 'accept' | 'decline';
  enrollmentId?: string;
  completed?: boolean;
}

export interface DeclineDetails {
  memberName: string;
  planName: string;
  declineReasons: string[];
}

export interface VerifyOtpResponse {
  accessToken: string;
}

export interface PendingQuestion {
  id: string;
  question: string;
  sentAt: string;
}

export interface MemberInfo {
  memberName: string;
  email: string;
  plan: string;
  requestedBy: string;
}

export interface PendingQuestionsData {
  member: MemberInfo;
  questions: PendingQuestion[];
}

export interface AnswerItem {
  questionId: number;
  answer: string;
}

export interface SubmitAnswersResponse {
  answeredCount: number;
}
