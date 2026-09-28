import type { NavItem } from '@/shared/types/nav';
import {
  MdDashboard,
  MdAssessment,
  MdInventory2,
  MdPointOfSale,
  MdStorefront,
  MdPeople,
  MdGroups,
  MdLocalShipping,
  MdReceiptLong,
  MdSwapHoriz,
  MdAssignmentReturn,
  MdPayments,
  MdHistory,
  // MdTimeline, // unused while Activity is commented out
  // MdPerson, // unused while Member Portal is commented out
} from 'react-icons/md';

// Sprint 7 shell cleanup (PRD §6): the enrollment-domain nav entries
// (Enrollments, Pending Response, Pending Signatures) are removed since
// their routes are no longer registered in AdminShell — this is a pharmacy
// app now, not the insurance-enrollment shell it was cloned from.
//
// The 'pos' entry (Sprint 9, STORY-040) is listed unconditionally here, same
// as every other entry — actual permission-gated omission (a cashier without
// `sales:create` never sees it) happens in AppRouter's AdminShell, which
// filters this array by hasPermission() before handing it to PageLayout.
// 'branches' and 'staff' (Sprint 10, STORY-042/043) follow the same
// pattern — gated on branch:read/user:read respectively in AdminShell.
// 'customers' and 'suppliers' (Sprint 11, STORY-045/046) follow the same
// pattern too — gated on customer:read/supplier:read respectively.
// 'purchasing' (Sprint 12, STORY-047/048) follows the same pattern — gated
// on purchasing:read in AdminShell.
// 'inventory' (Sprint 13, STORY-049/050/051) follows the same pattern too —
// gated on inventory:read in AdminShell (the stricter inventory:adjust
// permission only gates the adjustment form/button inside the page itself).
// 'returns' (Sprint 14, STORY-052/053) follows the same pattern too — gated
// on returns:create in AdminShell.
// 'expenses' (Sprint 15, STORY-054/055) follows the same pattern too —
// gated on (expense:read || cash:read) in AdminShell, since the nav entry
// leads to a page with two independently-permissioned tabs (expense list,
// cash detail) and should show if the user can reach either one.
// 'audit_log' (Sprint 16, STORY-056) is the one exception to the pattern
// above being permission-based: it's gated on hasRole('admin') in
// AdminShell (PRD §2/§3) — no non-admin role, including a tenant's own
// owner, ever sees this entry.
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: MdDashboard },
  { id: 'reports', label: 'Reports', icon: MdAssessment },
  { id: 'catalog', label: 'Catalog', icon: MdInventory2 },
  { id: 'pos', label: 'Point of Sale', icon: MdPointOfSale },
  { id: 'branches', label: 'Branches', icon: MdStorefront },
  { id: 'staff', label: 'Staff', icon: MdPeople },
  { id: 'customers', label: 'Customers', icon: MdGroups },
  { id: 'suppliers', label: 'Suppliers', icon: MdLocalShipping },
  { id: 'purchasing', label: 'Purchasing', icon: MdReceiptLong },
  { id: 'inventory', label: 'Inventory', icon: MdSwapHoriz },
  { id: 'returns', label: 'Returns', icon: MdAssignmentReturn },
  { id: 'expenses', label: 'Expenses & Cash', icon: MdPayments },
  { id: 'audit_log', label: 'Audit Log', icon: MdHistory },
  // TODO: bring back once Activity page is ready
  // { id: 'activity', label: 'Activity', icon: MdTimeline },
  // TODO: bring back once Member Portal is ready
  // { id: 'member_portal', label: 'Member Portal', icon: MdPerson },
];
