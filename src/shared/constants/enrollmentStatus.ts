import type { EnrollmentStatus } from '@/domains/enrollments/types';

// ── API status values ────────────────────────────────────────────────────────

export const API_STATUSES = [
  'pending_underwriting',
  'pending_response',
  'pending_signature',
  'ready_to_activate',
  'active',
  'declined_by_uw',
  'declined_by_member',
  'termed',
] as const;

export type ApiStatus = (typeof API_STATUSES)[number];

// ── Single source of truth: API → UI ────────────────────────────────────────

export const API_TO_UI_STATUS = {
  pending_underwriting: 'Pending Underwriting',
  pending_response: 'Pending Response',
  pending_signature: 'Pending Signature',
  ready_to_activate: 'Ready to Activate',
  active: 'Active',
  declined_by_uw: 'Declined by UW',
  declined_by_member: 'Declined by Member',
  termed: 'Termed',
} as const satisfies Record<ApiStatus, EnrollmentStatus>;

// ── Derived reverse mapping: UI → API ────────────────────────────────────────
// 'All' and 'Termed' resolve to undefined — no status param is sent for those tabs.

export const UI_TO_API_STATUS = Object.fromEntries(
  Object.entries(API_TO_UI_STATUS).map(([api, ui]) => [ui, api as ApiStatus])
) as Partial<Record<string, ApiStatus>>;

// ── UI tab filter list (order defines tab order) ─────────────────────────────

export const STATUS_FILTERS: string[] = [
  'Pending Underwriting',
  'Pending Response',
  'Pending Signature',
  'Ready to Activate',
  'Active',
  'Declined by UW',
  'Declined by Member',
  'Termed',
  'All',
];
