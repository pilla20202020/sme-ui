import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fetchEmailLogs,
  fetchEmailLogContent,
  forwardEmailLog,
  resendEmailLog,
  sendQuestionnaireReminder,
  sendSignatureReminder,
  type EmailLogsParams,
} from '@/domains/enrollments/api/emailLogsApi';

export const EMAIL_LOGS_QUERY_KEY = 'email-logs';

export function useEmailLogsQuery(params: EmailLogsParams) {
  return useQuery({
    queryKey: [EMAIL_LOGS_QUERY_KEY, params],
    queryFn: ({ signal }) => fetchEmailLogs(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useEmailLogContentQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: [EMAIL_LOGS_QUERY_KEY, 'content', id],
    queryFn: ({ signal }) => fetchEmailLogContent(id!, signal),
    enabled: !!id,
    staleTime: 5 * 60 * 1_000,
  });
}

export function useForwardEmailMutation() {
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => forwardEmailLog(id, email),
  });
}

export function useResendEmailMutation() {
  return useMutation({
    mutationFn: (id: string) => resendEmailLog(id),
  });
}

export function useSendQuestionnaireReminderMutation() {
  return useMutation({
    mutationFn: (enrollmentId: string) => sendQuestionnaireReminder(enrollmentId),
    onSuccess: () => toast.success('Questionnaire reminder sent successfully.'),
    onError: () => toast.error('Failed to send reminder. Please try again.'),
  });
}

export function useSendSignatureReminderMutation() {
  return useMutation({
    mutationFn: (enrollmentId: string) => sendSignatureReminder(enrollmentId),
    onSuccess: () => toast.success('Signature reminder sent successfully.'),
    onError: () => toast.error('Failed to send reminder. Please try again.'),
  });
}
