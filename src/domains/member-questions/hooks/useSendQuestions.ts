import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sendQuestionsApi } from '@/domains/member-questions/api/memberQuestionsApi';
import { ENROLLMENTS_QUERY_KEY } from '@/domains/enrollments/hooks/useEnrollmentsQuery';

interface SendQuestionsVars {
  policyId: string;
  questions: string[];
}

export function useSendQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ policyId, questions }: SendQuestionsVars) =>
      sendQuestionsApi(policyId, questions),

    onSuccess: () => {
      toast.success('Questions sent to member.');
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
    },

    onError: () => {
      toast.error('Failed to send questions. Please try again.');
    },
  });
}
