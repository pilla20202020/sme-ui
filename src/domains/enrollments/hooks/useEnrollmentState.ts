import { useState, useMemo } from 'react';
import { useEnrollmentFilters } from './useEnrollmentFilters';
import { useEnrollmentsQuery } from './useEnrollmentsQuery';
import { mapApiItemToEnrollment, mapApiCounts } from '@/domains/enrollments/api/enrollmentApi';
import type { EnrollmentStatus } from '@/domains/enrollments/types';

export function useEnrollmentState() {
  const [filterStatus, setFilterStatus] = useState<EnrollmentStatus | 'All' | 'Termed'>(
    'Pending Underwriting'
  );

  const { data, isLoading, isFetching, isPlaceholderData, isError, error } =
    useEnrollmentsQuery(filterStatus);

  // While switching tabs, keepPreviousData shows the previous tab's rows as a
  // placeholder — treat that as "loading" too so every tab gets its own skeleton
  // instead of a stale flash of the previous tab's data.
  const showLoading = isLoading || (isFetching && isPlaceholderData);

  // Transform raw API response here, not inside the query (avoids cache corruption).
  const enrollments = useMemo(() => data?.data.map(mapApiItemToEnrollment) ?? [], [data]);
  const apiCounts = useMemo(() => (data ? mapApiCounts(data.meta.counts) : {}), [data]);

  const filters = useEnrollmentFilters(enrollments, {
    controlledStatus: filterStatus,
    onStatusChange: setFilterStatus,
  });

  const counts = Object.keys(apiCounts).length ? apiCounts : filters.counts;

  return { enrollments, counts, filters, isLoading: showLoading, isError, error };
}
