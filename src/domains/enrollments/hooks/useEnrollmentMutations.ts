import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  approveEnrollment,
  editPlanSelection,
  changeEnrollmentStatus,
  type EnrollmentAction,
} from '@/domains/enrollments/api/enrollmentApi';
import { addEnrollmentNote } from '@/domains/enrollments/api/notesApi';
import { ENROLLMENTS_QUERY_KEY } from './useEnrollmentsQuery';
import { NOTES_QUERY_KEY } from './useNotesQuery';
import { ADMIN_PLAN_SELECTION_QUERY_KEY } from '@/domains/plan-selection/data/use-admin-plan-selection.query';
import type { Enrollment } from '@/domains/enrollments/types';

function useStatusMutation(
  action: EnrollmentAction,
  options: {
    successMessage: string;
    errorMessage: string;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Enrollment>({
    mutationFn: (enrollment) => changeEnrollmentStatus(enrollment.policyId, action),

    onSuccess: () => {
      // Show success toast (single source — do NOT also toast in per-call onSuccess)
      toast.success(options.successMessage);
    },

    onError: () => {
      // Show error toast (single source — do NOT also toast in per-call onError)
      toast.error(options.errorMessage);
    },

    onSettled: () => {
      // Invalidate only active enrollment queries so the current tab refetches
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
    },
  });
}

export function useRevertMutation() {
  return useStatusMutation('REVERT', {
    successMessage: 'Enrollment reverted to Pending Underwriting.',
    errorMessage: 'Failed to revert enrollment. Please try again.',
  });
}

export interface ApproveEnrollmentVars {
  enrollment: Enrollment;
  planIds: string[];
  tier: string;
}

export function useApproveEnrollmentMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ApproveEnrollmentVars>({
    mutationFn: ({ enrollment, planIds, tier }) =>
      approveEnrollment({ policyId: Number(enrollment.policyId), planIds, tier }),

    onSuccess: () => {
      toast.success('Enrollment approved successfully.');
    },

    onError: () => {
      toast.error('Failed to approve enrollment. Please try again.');
    },

    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ADMIN_PLAN_SELECTION_QUERY_KEY, vars.enrollment.id],
      });
    },
  });
}

export function useEditPlanSelectionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ApproveEnrollmentVars>({
    mutationFn: ({ enrollment, planIds, tier }) =>
      editPlanSelection({ policyId: Number(enrollment.policyId), planIds, tier }),

    onSuccess: () => {
      toast.success('Plan updated successfully.');
    },

    onError: () => {
      toast.error('Failed to update plan. Please try again.');
    },

    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ADMIN_PLAN_SELECTION_QUERY_KEY, vars.enrollment.id],
      });
    },
  });
}

export function useActivateMutation() {
  return useStatusMutation('ACTIVATE', {
    successMessage: 'Policy activated successfully.',
    errorMessage: 'Failed to activate policy. Please try again.',
  });
}

export interface RejectEnrollmentVars {
  enrollment: Enrollment;
  reason: string;
}

export function useRejectMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RejectEnrollmentVars>({
    mutationFn: ({ enrollment, reason }) =>
      changeEnrollmentStatus(enrollment.policyId, 'REJECT', reason),

    onSuccess: () => {
      toast.success('Enrollment declined by underwriting.');
    },

    onError: () => {
      toast.error('Failed to reject enrollment. Please try again.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
    },
  });
}

export function useAskQuestionMutation() {
  return useStatusMutation('ASK_QUESTION', {
    successMessage: 'Questions sent to member.',
    errorMessage: 'Failed to send questions. Please try again.',
  });
}

export function useResendSignatureMutation() {
  return useStatusMutation('SIGN_RECEIVED', {
    successMessage: 'Signature request resent.',
    errorMessage: 'Failed to resend signature request. Please try again.',
  });
}

export interface AddNoteVars {
  policyId: string;
  noteText: string;
}

export function useAddNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, AddNoteVars>({
    mutationFn: ({ policyId, noteText }) => addEnrollmentNote(policyId, noteText),

    onSuccess: () => {
      toast.success('Note added successfully.');
    },

    onError: () => {
      toast.error('Failed to add note. Please try again.');
    },

    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, vars.policyId] });
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
    },
  });
}
