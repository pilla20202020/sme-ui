import { useQuery } from '@tanstack/react-query';
import { fetchAdminPlanSelectionData } from '../api/adminPlanSelectionApi';

export const ADMIN_PLAN_SELECTION_QUERY_KEY = 'admin-plan-selection';

export function useAdminPlanSelectionQuery(id: number | null) {
  return useQuery({
    queryKey: [ADMIN_PLAN_SELECTION_QUERY_KEY, id],
    queryFn: () => fetchAdminPlanSelectionData(id!),
    enabled: !!id,
    retry: false,
    staleTime: Infinity,
  });
}
