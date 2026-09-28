import { useQuery } from '@tanstack/react-query';
import { fetchL713Plans } from '../api/l713PlansApi';

export function useL713Plans(policyId: string) {
  return useQuery({
    queryKey: ['l713-plans', policyId],
    queryFn: ({ signal }) => fetchL713Plans(policyId, signal),
    enabled: !!policyId,
  });
}
