import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/routeConfig';

export function useAppNavigation() {
  const navigate = useNavigate();

  /** Used by the sidebar nav — maps nav item IDs to routes. */
  const navigateTo = useCallback(
    (id: string) => {
      switch (id) {
        case 'dashboard':
          navigate(ROUTES.DASHBOARD);
          break;
        case 'reports':
          navigate(ROUTES.REPORTS);
          break;
        case 'catalog':
          navigate(ROUTES.CATALOG);
          break;
        case 'pos':
          navigate(ROUTES.POS);
          break;
        case 'branches':
          navigate(ROUTES.BRANCHES);
          break;
        case 'staff':
          navigate(ROUTES.STAFF);
          break;
        case 'customers':
          navigate(ROUTES.CUSTOMERS);
          break;
        case 'suppliers':
          navigate(ROUTES.SUPPLIERS);
          break;
        case 'purchasing':
          navigate(ROUTES.PURCHASE_ORDERS);
          break;
        case 'inventory':
          navigate(ROUTES.INVENTORY);
          break;
        case 'returns':
          navigate(ROUTES.RETURNS);
          break;
        case 'expenses':
          navigate(ROUTES.EXPENSES);
          break;
        case 'audit_log':
          navigate(ROUTES.AUDIT_LOG);
          break;
        case 'member_portal':
          navigate(ROUTES.MEMBER_PORTAL);
          break;
      }
    },
    [navigate]
  );

  /** Used by in-page navigation (e.g. Dashboard tile → a related page). */
  const navigatePage = useCallback(
    (targetPage: string) => {
      switch (targetPage) {
        case 'dashboard':
          navigate(ROUTES.DASHBOARD);
          break;
        case 'reports':
          navigate(ROUTES.REPORTS);
          break;
        case 'catalog':
          navigate(ROUTES.CATALOG);
          break;
      }
    },
    [navigate]
  );

  return { navigateTo, navigatePage };
}
