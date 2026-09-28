import { useQuery } from '@tanstack/react-query';
import { fetchPolicyReport } from '../api/policyReportApi';

export function usePolicyReport(policyId: string) {
  return useQuery({
    queryKey: ['policy-report', policyId],
    queryFn: ({ signal }) => fetchPolicyReport(policyId, signal),
    enabled: !!policyId,
  });
}
