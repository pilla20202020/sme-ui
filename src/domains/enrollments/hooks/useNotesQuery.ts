import { useQuery } from '@tanstack/react-query';
import { fetchEnrollmentNotes } from '@/domains/enrollments/api/notesApi';

export const NOTES_QUERY_KEY = 'enrollment-notes';

export function useNotesQuery(policyId: string | undefined) {
  return useQuery({
    queryKey: [NOTES_QUERY_KEY, policyId],
    queryFn: ({ signal }) => fetchEnrollmentNotes(policyId!, signal),
    enabled: !!policyId,
    staleTime: 30_000,
  });
}
