export const ROUTES = {
  DASHBOARD: '/',
  REPORTS: '/reports',
  CATALOG: '/catalog',
  POS: '/pos',
  POS_RECEIPT: '/pos/:saleId/receipt',
  BRANCHES: '/branches',
  STAFF: '/staff',
  CUSTOMERS: '/customers',
  SUPPLIERS: '/suppliers',
  PURCHASE_ORDERS: '/purchase-orders',
  PURCHASE_ORDER_DETAIL: '/purchase-orders/:purchaseOrderId',
  INVENTORY: '/inventory',
  RETURNS: '/returns',
  EXPENSES: '/expenses',
  // SPRINT-016, STORY-056 (PRD §2/§5): admin/support-only, cross-tenant
  // audit log viewer — gated on hasRole('admin'), not a permission check,
  // the first route in this app to use that gate.
  AUDIT_LOG: '/audit-log',
  // Enrollment-domain routes — no longer registered in AdminShell's <Routes>
  // or the sidebar nav (Sprint 7 shell cleanup, PRD §6), but kept here
  // because the underlying enrollment page/component files are intentionally
  // NOT deleted this sprint and still reference these constants internally
  // (e.g. EnrollmentsContainer's own row-navigation). Removing them would
  // break those files for no functional gain — they're simply unreachable
  // dead code paths now that nothing routes to them.
  ENROLLMENTS: '/enrollments',
  ENROLLMENT_MEDICAL_DETAILS: '/enrollments/:policyId/medical-details',
  ACTIVITY: '/activity',
  PLAN_SELECTION_ADMIN: '/admin/plan-selection',
  MEMBER_PORTAL: '/member-portal',
  MEMBER_PORTAL_ACCESS: '/member-portal/access',
  MEMBER_PORTAL_OTP: '/member-portal/otp',
  MEMBER_PORTAL_PLAN_SELECTION: '/member-portal/plan-selection',
  MEMBER_PORTAL_DECLINE: '/member-portal/decline',
  OTP: '/plan-selection/verify',
  PLAN_SELECTION: '/plan-selection/select',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
