import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useDrawer } from '../hooks/useDrawer';
import { useEnrollmentState } from '../hooks/useEnrollmentState';
import { ENROLLMENTS_QUERY_KEY } from '../hooks/useEnrollmentsQuery';
import type { Enrollment, EnrollmentStatus } from '../types';
import { EnrollmentsContext } from './EnrollmentsContext';

export function EnrollmentsProvider({ children }: { children: ReactNode }) {
  const { displayName } = useCurrentUser();
  const { enrollments, counts, filters, isLoading, isError } = useEnrollmentState();
  const drawer = useDrawer();
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    const status = (location.state as { filterStatus?: string } | null)?.filterStatus;
    if (status) {
      filters.setFilterStatus(status as EnrollmentStatus | 'All' | 'Termed');
    }
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBulkApprove = useCallback(
    (selected: Enrollment[]) => {
      queryClient.setQueriesData<{ enrollments: Enrollment[]; counts: Record<string, number> }>(
        { queryKey: [ENROLLMENTS_QUERY_KEY] },
        (old) => {
          if (!old) return old;
          const ids = new Set(selected.map((e) => e.key));
          return {
            ...old,
            enrollments: old.enrollments.map((e) =>
              ids.has(e.key)
                ? {
                    ...e,
                    status: 'Ready to Activate' as const,
                    activities: [
                      ...e.activities,
                      {
                        action: 'Bulk approved by administrator',
                        date: new Date().toISOString(),
                        actor: displayName,
                        color: 'green',
                      },
                    ],
                  }
                : e
            ),
          };
        }
      );

      toast.success(`${selected.length} enrollment(s) approved.`);

      console.info('[Audit Trail] Bulk Approval', {
        admin: displayName,
        timestamp: new Date().toISOString(),
        enrollmentIds: selected.map((e) => e.policyId),
      });
    },
    [displayName, queryClient]
  );

  const value = useMemo(
    () => ({ enrollments, counts, filters, drawer, isLoading, isError, handleBulkApprove }),
    [enrollments, counts, filters, drawer, isLoading, isError, handleBulkApprove]
  );

  return <EnrollmentsContext.Provider value={value}>{children}</EnrollmentsContext.Provider>;
}
