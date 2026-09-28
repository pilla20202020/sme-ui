import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  fetchEnrollments,
  UI_TO_API_STATUS,
} from '@/domains/enrollments/api/enrollmentApi';
import type { EnrollmentStatus } from '@/domains/enrollments/types';

export const ENROLLMENTS_QUERY_KEY = 'enrollments';

/**
 * Returns raw API response. We deliberately skip `select` here so that
 * React Query's cache always holds the raw shape — this prevents
 * setQueriesData in mutations from writing a transformed shape that
 * then breaks the select transform on the next read.
 */
export function useEnrollmentsQuery(filterStatus: EnrollmentStatus | 'All' | 'Termed') {
  const apiStatus = UI_TO_API_STATUS[filterStatus];

  return useQuery({
    queryKey: [ENROLLMENTS_QUERY_KEY, filterStatus],
    queryFn: ({ signal }) => fetchEnrollments({ status: apiStatus }, signal),
    // Keep showing the previous tab's data while the new tab fetches
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
