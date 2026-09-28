import { useQuery } from '@tanstack/react-query';
import { validateAccessApi } from '@/domains/member-questions/api/memberQuestionsApi';

export const VALIDATE_ACCESS_QUERY_KEY = 'portalValidateAccess';

export function useValidateAccess(token: string) {
  return useQuery({
    queryKey: [VALIDATE_ACCESS_QUERY_KEY, token],
    queryFn: () => validateAccessApi(token),
    retry: false,
    enabled: !!token,
  });
}
