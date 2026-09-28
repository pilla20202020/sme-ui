import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/app/providers/ThemeContext';
import { useAuth } from '@/app/providers/AuthContext';
import { PharmacyDashboardPage } from '@/domains/pharmacy-dashboard/pages/PharmacyDashboardPage';
import { ReportsPage } from '@/domains/reports/pages/ReportsPage';
import { ProductsListPage } from '@/domains/catalog/pages/ProductsListPage';
import { PosPage } from '@/domains/sales/pages/PosPage';
import { ReceiptPage } from '@/domains/sales/pages/ReceiptPage';
import { BranchesListPage } from '@/domains/branches/pages/BranchesListPage';
import { StaffListPage } from '@/domains/staff/pages/StaffListPage';
import { CustomersListPage } from '@/domains/customers/pages/CustomersListPage';
import { SuppliersListPage } from '@/domains/suppliers/pages/SuppliersListPage';
import { PurchaseOrdersListPage } from '@/domains/purchasing/pages/PurchaseOrdersListPage';
import { PurchaseOrderDetailPage } from '@/domains/purchasing/pages/PurchaseOrderDetailPage';
import { InventoryPage } from '@/domains/inventory/pages/InventoryPage';
import { ReturnsPage } from '@/domains/returns/pages/ReturnsPage';
import { ExpensesPage } from '@/domains/expenses/pages/ExpensesPage';
import { AuditLogPage } from '@/domains/audit-log/pages/AuditLogPage';
import { PageLayout } from '@/layouts';
import { MemberPortalPage } from '@/domains/member-portal';
import { OtpPage } from '@/domains/otp';
import { PlanSelectionPage } from '@/domains/plan-selection';
import { MemberAccessPage, DeclinePage } from '@/domains/member-questions';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { NAV_ITEMS } from '@/shared/constants';
import { useGlobalStyle } from './hooks/useGlobalStyle';
import { useAppNavigation } from './hooks/useAppNavigation';
import { ROUTES } from './routeConfig';

function deriveActiveNav(pathname: string): string {
  if (pathname === ROUTES.REPORTS) return 'reports';
  if (pathname === ROUTES.CATALOG) return 'catalog';
  if (pathname.startsWith(ROUTES.POS)) return 'pos';
  if (pathname === ROUTES.BRANCHES) return 'branches';
  if (pathname === ROUTES.STAFF) return 'staff';
  if (pathname === ROUTES.CUSTOMERS) return 'customers';
  if (pathname === ROUTES.SUPPLIERS) return 'suppliers';
  if (pathname.startsWith(ROUTES.PURCHASE_ORDERS)) return 'purchasing';
  if (pathname === ROUTES.INVENTORY) return 'inventory';
  if (pathname === ROUTES.RETURNS) return 'returns';
  if (pathname === ROUTES.EXPENSES) return 'expenses';
  if (pathname === ROUTES.AUDIT_LOG) return 'audit_log';
  return 'dashboard';
}

function AdminShell() {
  const { T } = useTheme();
  const { logout, hasPermission, hasRole } = useAuth();
  const { displayName, email } = useCurrentUser();
  const location = useLocation();

  useGlobalStyle(T);

  const { navigateTo } = useAppNavigation();
  const activeNav = deriveActiveNav(location.pathname);

  // Permission-gated omission (Sprint 9, STORY-040 PRD §2): a user without
  // `sales:create` never sees the Point of Sale nav entry, and the route
  // below isn't registered for them either — falling through to the
  // wildcard redirect — never a disabled/greyed-out control.
  const canSell = hasPermission('sales:create');
  const canReadSales = hasPermission('sales:read');
  // Sprint 10, STORY-042/043 (PRD §2): same route-level gating pattern —
  // a user without branch:read/user:read never sees the nav entry, and the
  // route isn't registered for them either, not just hidden/disabled.
  const canReadBranches = hasPermission('branch:read');
  const canReadStaff = hasPermission('user:read');
  // Sprint 11, STORY-045/046 (PRD §2): same route-level gating pattern —
  // a user without customer:read/supplier:read never sees the nav entry,
  // and the route isn't registered for them either.
  const canReadCustomers = hasPermission('customer:read');
  const canReadSuppliers = hasPermission('supplier:read');
  // Sprint 12, STORY-047/048 (PRD §2): same route-level gating pattern — a
  // user without purchasing:read never sees the nav entry, and neither the
  // list nor the detail/receiving route is registered for them either.
  const canReadPurchasing = hasPermission('purchasing:read');
  // Sprint 13, STORY-049/050/051 (PRD §2): same route-level gating pattern —
  // a user without inventory:read never sees the nav entry, and the route
  // isn't registered for them either. The stricter inventory:adjust
  // permission (adjustment form/button) is gated separately, inside
  // InventoryPage itself, not at this route/nav level.
  const canReadInventory = hasPermission('inventory:read');
  // Sprint 14, STORY-052/053 (PRD §2): same route-level gating pattern — a
  // user without returns:create never sees the nav entry, and the route
  // isn't registered for them either. The stricter, payload-dependent
  // returns:override check (STORY-053's override branch) can't be gated
  // structurally at this level — it's asserted in-service against whichever
  // user is named as overrideApprovedBy, not the caller.
  const canCreateReturns = hasPermission('returns:create');
  // Sprint 15, STORY-054/055 (PRD §2): same route-level gating pattern — a
  // user without expense:read AND without cash:read never sees the nav
  // entry, and the route isn't registered for them either. Inside the page,
  // expense:create/expense:read/cash:read are each still checked
  // independently per tab/action (PRD's don't-conflate instruction) — this
  // outer OR only decides whether the page is reachable at all.
  const canReadExpensesOrCash = hasPermission('expense:read') || hasPermission('cash:read');
  // Sprint 16, STORY-056 (PRD §2/§3): the one deliberate exception to every
  // gate above being a permission check — this route/nav entry is gated on
  // hasRole('admin') directly, mirroring the backend's own @Roles('admin')
  // stacked onto @Permissions('audit:read') on the audit-logs endpoint.
  // Even a tenant's own owner (who could plausibly hold some permission
  // some day) must never see this without the admin role itself.
  const canReadAuditLog = hasRole('admin');
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.id === 'pos') return canSell;
    if (item.id === 'branches') return canReadBranches;
    if (item.id === 'staff') return canReadStaff;
    if (item.id === 'customers') return canReadCustomers;
    if (item.id === 'suppliers') return canReadSuppliers;
    if (item.id === 'purchasing') return canReadPurchasing;
    if (item.id === 'inventory') return canReadInventory;
    if (item.id === 'returns') return canCreateReturns;
    if (item.id === 'expenses') return canReadExpensesOrCash;
    if (item.id === 'audit_log') return canReadAuditLog;
    return true;
  });

  return (
    <PageLayout
      activeNav={activeNav}
      onNavTo={navigateTo}
      navItems={visibleNavItems}
      userName={displayName}
      userEmail={email}
      onLogout={logout}
    >
      <Routes>
        <Route path={ROUTES.DASHBOARD} element={<PharmacyDashboardPage />} />
        <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
        <Route path={ROUTES.CATALOG} element={<ProductsListPage />} />
        {canSell && <Route path={ROUTES.POS} element={<PosPage />} />}
        {canReadSales && <Route path={ROUTES.POS_RECEIPT} element={<ReceiptPage />} />}
        {canReadBranches && <Route path={ROUTES.BRANCHES} element={<BranchesListPage />} />}
        {canReadStaff && <Route path={ROUTES.STAFF} element={<StaffListPage />} />}
        {canReadCustomers && <Route path={ROUTES.CUSTOMERS} element={<CustomersListPage />} />}
        {canReadSuppliers && <Route path={ROUTES.SUPPLIERS} element={<SuppliersListPage />} />}
        {canReadPurchasing && (
          <Route path={ROUTES.PURCHASE_ORDERS} element={<PurchaseOrdersListPage />} />
        )}
        {canReadPurchasing && (
          <Route path={ROUTES.PURCHASE_ORDER_DETAIL} element={<PurchaseOrderDetailPage />} />
        )}
        {canReadInventory && <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />}
        {canCreateReturns && <Route path={ROUTES.RETURNS} element={<ReturnsPage />} />}
        {canReadExpensesOrCash && <Route path={ROUTES.EXPENSES} element={<ExpensesPage />} />}
        {canReadAuditLog && <Route path={ROUTES.AUDIT_LOG} element={<AuditLogPage />} />}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </PageLayout>
  );
}

export function AppRouter() {
  const location = useLocation();

  const isMemberRoute =
    location.pathname.startsWith('/member-portal') ||
    location.pathname.startsWith('/plan-selection');

  if (isMemberRoute) {
    return (
      <Routes>
        <Route path={ROUTES.MEMBER_PORTAL_ACCESS} element={<MemberAccessPage />} />
        <Route path={ROUTES.MEMBER_PORTAL_OTP} element={<OtpPage />} />
        <Route path={ROUTES.MEMBER_PORTAL_PLAN_SELECTION} element={<PlanSelectionPage />} />
        <Route path={ROUTES.MEMBER_PORTAL_DECLINE} element={<DeclinePage />} />
        <Route path={ROUTES.MEMBER_PORTAL} element={<MemberPortalPage />} />
        <Route path={ROUTES.OTP} element={<OtpPage />} />
        <Route path={ROUTES.PLAN_SELECTION} element={<PlanSelectionPage />} />
        <Route path="*" element={<Navigate to={ROUTES.MEMBER_PORTAL_ACCESS} replace />} />
      </Routes>
    );
  }

  return <AdminShell />;
}
