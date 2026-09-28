import { useState, useMemo } from 'react';
import type { Enrollment, EnrollmentStatus } from '@/domains/enrollments/types';

type SortDir = 'asc' | 'desc';

interface UseEnrollmentFiltersOptions {
  /** When provided, filterStatus is controlled externally (React Query mode). */
  controlledStatus?: EnrollmentStatus | 'All' | 'Termed';
  onStatusChange?: (status: EnrollmentStatus | 'All' | 'Termed') => void;
}

export function useEnrollmentFilters(
  enrollments: Enrollment[],
  options: UseEnrollmentFiltersOptions = {}
) {
  const [internalStatus, setInternalStatus] = useState<EnrollmentStatus | 'All' | 'Termed'>(
    'Pending Underwriting'
  );

  const filterStatus = options.controlledStatus ?? internalStatus;
  const setFilterStatus = (s: EnrollmentStatus | 'All' | 'Termed') => {
    if (options.onStatusChange) options.onStatusChange(s);
    else setInternalStatus(s);
  };
  const [searchText, setSearchText] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('All');
  const [sortCol, setSortCol] = useState<keyof Enrollment | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      All: enrollments.length,
      'Pending Underwriting': 0,
      'Pending Response': 0,
      'Pending Signature': 0,
      'Ready to Activate': 0,
      Active: 0,
      'Declined by UW': 0,
      'Declined by Member': 0,
      Termed: 0,
    };
    enrollments.forEach((e) => {
      if (c[e.status] !== undefined) c[e.status]++;
    });
    c['Termed'] += c['Declined by UW'] + c['Declined by Member'];
    return c;
  }, [enrollments]);

  const filtered = useMemo(() => {
    let data = [...enrollments];
    if (filterStatus !== 'All') {
      data =
        filterStatus === 'Termed'
          ? data.filter(
              (e) =>
                e.status === 'Declined by UW' ||
                e.status === 'Declined by Member' ||
                e.status === 'Termed'
            )
          : data.filter((e) => e.status === filterStatus);
    }
    if (carrierFilter !== 'All') data = data.filter((e) => e.groupName === carrierFilter);
    if (searchText) {
      const s = searchText.toLowerCase();
      data = data.filter(
        (e) =>
          e.name.toLowerCase().includes(s) ||
          e.policyId.toLowerCase().includes(s) ||
          e.email.toLowerCase().includes(s) ||
          e.planName.toLowerCase().includes(s)
      );
    }
    if (sortCol) {
      data.sort((a, b) => {
        let va: unknown = a[sortCol];
        let vb: unknown = b[sortCol];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if ((va as string | number) < (vb as string | number)) return sortDir === 'asc' ? -1 : 1;
        if ((va as string | number) > (vb as string | number)) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [enrollments, filterStatus, carrierFilter, searchText, sortCol, sortDir]);

  function handleSort(col: keyof Enrollment) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  return {
    filterStatus,
    setFilterStatus,
    searchText,
    setSearchText,
    carrierFilter,
    setCarrierFilter,
    sortCol,
    sortDir,
    handleSort,
    counts,
    filtered,
  };
}
