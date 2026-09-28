import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../api/dashboardApi';

export const DASHBOARD_QUERY_KEY = 'dashboard-summary';

export function useDashboard() {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY],
    queryFn: ({ signal }) => fetchDashboard(signal),
    staleTime: 60_000,
  });
}
