import { useQuery } from '@tanstack/react-query';
import { fetchQuestionLogApi } from '@/domains/member-questions/api/memberQuestionsApi';
import type { QuestionLogItem } from '@/domains/member-questions/types';

export interface QaThread {
  round: number;
  askedBy: string;
  dateSent: string;
  questions: string[];
  answers: string[] | null;
  dateAnswered: string | null;
}

export const QUESTION_LOG_QUERY_KEY = 'questionLog';

/**
 * Groups a flat list of QuestionLogItems into QaThread rounds for display.
 * Questions sharing an identical `sentAt` timestamp belong to the same round.
 */
export function groupIntoQaThreads(items: QuestionLogItem[]): QaThread[] {
  const grouped = new Map<string, QuestionLogItem[]>();

  for (const item of items) {
    const bucket = grouped.get(item.sentAt) ?? [];
    bucket.push(item);
    grouped.set(item.sentAt, bucket);
  }

  return Array.from(grouped.values()).map((group, idx) => {
    const allAnswered = group.every((i) => i.status === 'ANSWERED');
    const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    return {
      round: idx + 1,
      askedBy: group[0].askedBy,
      dateSent: formatDate(group[0].sentAt),
      questions: group.map((i) => i.question),
      answers: allAnswered ? group.map((i) => i.answer ?? '') : null,
      dateAnswered: allAnswered && group[0].respondedAt ? formatDate(group[0].respondedAt) : null,
    };
  });
}

export function useQuestionLog(policyId: string) {
  return useQuery({
    queryKey: [QUESTION_LOG_QUERY_KEY, policyId],
    queryFn: () => fetchQuestionLogApi(policyId),
    staleTime: 30_000,
    enabled: !!policyId,
  });
}
