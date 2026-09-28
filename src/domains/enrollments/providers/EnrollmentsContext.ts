import { createContext } from 'react';
import type { Enrollment } from '../types';
import type { useDrawer } from '../hooks/useDrawer';
import type { useEnrollmentState } from '../hooks/useEnrollmentState';

type DrawerHandle = ReturnType<typeof useDrawer>;
type EnrollmentFilters = ReturnType<typeof useEnrollmentState>['filters'];

export interface EnrollmentsContextValue {
  enrollments: Enrollment[];
  counts: Record<string, number>;
  filters: EnrollmentFilters;
  drawer: DrawerHandle;
  isLoading: boolean;
  isError: boolean;
  handleBulkApprove: (selected: Enrollment[]) => void;
}

export const EnrollmentsContext = createContext<EnrollmentsContextValue | null>(null);
