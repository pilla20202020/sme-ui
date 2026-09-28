import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  submitPlanSelection,
  submitMemberPlanSelection,
  type SubmitPlanSelectionPayload,
  type MemberSubmitPlanSelectionPayload,
} from '../api/planSelectionApi';
import { ENROLLMENTS_QUERY_KEY } from '@/domains/enrollments/hooks/useEnrollmentsQuery';

export function useSubmitPlanSelectionMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitPlanSelectionPayload | MemberSubmitPlanSelectionPayload) =>
      accessToken
        ? submitMemberPlanSelection(payload as MemberSubmitPlanSelectionPayload, accessToken)
        : submitPlanSelection(payload as SubmitPlanSelectionPayload),
    onSettled: () => {
      if (!accessToken) {
        queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
      }
    },
  });
}
