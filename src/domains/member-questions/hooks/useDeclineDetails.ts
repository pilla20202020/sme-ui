import { useQuery } from '@tanstack/react-query';
import { getDeclineDetailsApi } from '@/domains/member-questions/api/memberQuestionsApi';

export const DECLINE_DETAILS_QUERY_KEY = 'memberDeclineDetails';

export function useDeclineDetails(token: string) {
  return useQuery({
    queryKey: [DECLINE_DETAILS_QUERY_KEY, token],
    queryFn: () => getDeclineDetailsApi(token),
    retry: false,
    enabled: !!token,
  });
}
