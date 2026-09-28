import type { Plan } from '@/shared/constants';

export interface PhqAnswer {
  question: string;
  answer: 'Yes' | 'No';
  detail: string;
}

export interface Dependent {
  name: string;
  relationship: 'Spouse' | 'Child';
  dob: string;
  gender: string;
}

export interface EmailLog {
  id: string;
  recipients: string;
  subject: string;
  dateSent: string;
  direction?: 'Sent' | 'Received';
  status: 'Delivered' | 'Failed' | 'Bounced';
  reason: string;
}

export interface ActivityEntry {
  action: string;
  date: string;
  actor: string;
  color: string;
}

export type EnrollmentStatus =
  | 'Pending Underwriting'
  | 'Pending Response'
  | 'Pending Signature'
  | 'Ready to Activate'
  | 'Active'
  | 'Declined by UW'
  | 'Declined by Member'
  | 'Termed';

export type RiskLevel = 'high' | 'med' | null;

export interface Enrollment {
  id: number;
  key: string;
  userId: string;
  policyId: string;
  status: EnrollmentStatus;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  age: number;
  ssn: string;
  height: string;
  weight: string;
  address: string;
  agentId: string;
  agentName: string;
  agentRepCode: string;
  groupId: string;
  groupName: string;
  groupType: string;
  enrollDate: string;
  effectiveDate: string;
  plan: Plan | null;
  planId: string;
  planName: string;
  premium: number;
  tier: string;
  recommendation: 'Yes' | 'No';
  recommendationText: string | null;
  approvedPolicyIds: string[];
  notApprovedPolicyIds: string[];
  answeredQuestions: boolean;
  invoicePaid: boolean;
  riskFlag: RiskLevel;
  paymentMethod: string;
  recurringMethod: string;
  phqAnswers: PhqAnswer[];
  dependents: Dependent[];
  emailLogs: EmailLog[];
  notes: { text: string; author: string; date: string }[];
  activities: ActivityEntry[];
  /** Only populated for statuses: Declined by UW, Declined by Member, Termed. */
  rejectionReason: string | null;
  enrollmentPlans: Plan[];
  selectedPlanIds: string[];
  approvedBy?: string;
  browser: string;
  ipAddress: string;
  enrollmentTimestamp: string;
  contractDownloadUrl: string | null;
}
