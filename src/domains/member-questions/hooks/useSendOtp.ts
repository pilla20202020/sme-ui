import { useMutation } from '@tanstack/react-query';
import { sendOtpApi } from '@/domains/member-questions/api/memberQuestionsApi';

export function useSendOtp() {
  return useMutation({
    mutationFn: (token: string) => sendOtpApi(token),
  });
}
