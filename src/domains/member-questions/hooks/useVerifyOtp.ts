import { useMutation } from '@tanstack/react-query';
import { verifyOtpApi } from '@/domains/member-questions/api/memberQuestionsApi';

interface VerifyOtpVars {
  token: string;
  otp: string;
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ token, otp }: VerifyOtpVars) => verifyOtpApi(token, otp),
  });
}
