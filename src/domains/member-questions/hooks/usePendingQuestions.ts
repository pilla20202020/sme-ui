import { useQuery } from '@tanstack/react-query';
import { fetchPendingQuestionsApi } from '@/domains/member-questions/api/memberQuestionsApi';

export const PENDING_QUESTIONS_QUERY_KEY = 'portalPendingQuestions';

export function usePendingQuestions(accessToken: string | null) {
  return useQuery({
    queryKey: [PENDING_QUESTIONS_QUERY_KEY],
    queryFn: () => fetchPendingQuestionsApi(accessToken!),
    enabled: !!accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
