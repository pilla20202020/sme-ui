import { useContext } from 'react';
import { EnrollmentsContext, type EnrollmentsContextValue } from '../providers/EnrollmentsContext';

export function useEnrollments(): EnrollmentsContextValue {
  const ctx = useContext(EnrollmentsContext);
  if (!ctx) throw new Error('useEnrollments must be used within EnrollmentsProvider');
  return ctx;
}
