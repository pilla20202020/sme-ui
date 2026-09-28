import { useMutation } from '@tanstack/react-query';
import { submitAnswersApi } from '@/domains/member-questions/api/memberQuestionsApi';
import type { AnswerItem } from '@/domains/member-questions/types';

interface SubmitAnswersVars {
  accessToken: string;
  answers: AnswerItem[];
}

export function useSubmitAnswers() {
  return useMutation({
    mutationFn: ({ accessToken, answers }: SubmitAnswersVars) =>
      submitAnswersApi(accessToken, answers),
  });
}
