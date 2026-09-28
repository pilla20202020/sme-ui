import { useQuery } from '@tanstack/react-query';
import {
  fetchPlanSelectionData,
  fetchMemberPlanSelectionData,
  type PlanSelectionData,
} from '../api/planSelectionApi';

export const PLAN_SELECTION_QUERY_KEY = 'plan-selection';

export function usePlanSelectionQuery(
  id: number | null,
  accessToken?: string | null,
  placeholderData?: PlanSelectionData
) {
  return useQuery({
    queryKey: [PLAN_SELECTION_QUERY_KEY, accessToken ? 'portal' : id],
    queryFn: () =>
      accessToken ? fetchMemberPlanSelectionData(accessToken) : fetchPlanSelectionData(id!),
    enabled: accessToken ? !!accessToken : !!id,
    retry: false,
    staleTime: Infinity,
    placeholderData,
  });
}
