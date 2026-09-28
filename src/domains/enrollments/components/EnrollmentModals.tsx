import {
  AskQuestionModal,
  ApproveOffcanvas,
  RejectModal,
  NotesOffcanvas,
  EmailLogsOffcanvas,
  ActivateModal,
  RevertModal,
  ReminderModal,
  ResendSignatureModal,
} from '@/domains/enrollments/components/modals';
import { useEnrollmentStore } from '@/stores/enrollmentStore';
import {
  useRevertMutation,
  useApproveEnrollmentMutation,
  useEditPlanSelectionMutation,
  useActivateMutation,
  useRejectMutation,
  useAddNoteMutation,
} from '@/domains/enrollments/hooks/useEnrollmentMutations';
import { useNotesQuery } from '@/domains/enrollments/hooks/useNotesQuery';
import { useSendQuestions } from '@/domains/member-questions/hooks/useSendQuestions';
import {
  useSendQuestionnaireReminderMutation,
  useSendSignatureReminderMutation,
} from '@/domains/enrollments/hooks/useEmailLogsQuery';

export function EnrollmentModals() {
  const {
    askQuestion,
    approve,
    editPlan,
    reject,
    notes,
    emailLogs,
    activate,
    revert,
    reminder,
    resendSignature,
    closeModal,
  } = useEnrollmentStore();

  const revertMutation = useRevertMutation();
  const approveEnrollmentMutation = useApproveEnrollmentMutation();
  const editPlanSelectionMutation = useEditPlanSelectionMutation();
  const activateMutation = useActivateMutation();
  const rejectMutation = useRejectMutation();
  const addNoteMutation = useAddNoteMutation();
  const notesQuery = useNotesQuery(notes?.policyId);
  const sendQuestionsMutation = useSendQuestions();
  const reminderMutation = useSendQuestionnaireReminderMutation();
  const resendSignatureMutation = useSendSignatureReminderMutation();

  return (
    <>
      {askQuestion && (
        <AskQuestionModal
          enrollment={askQuestion}
          onClose={() => closeModal('askQuestion')}
          isPending={sendQuestionsMutation.isPending}
          onSend={(enrollment, questions) => {
            sendQuestionsMutation.mutate(
              { policyId: enrollment.policyId, questions },
              { onSuccess: () => closeModal('askQuestion') }
            );
          }}
        />
      )}

      {approve && (
        <ApproveOffcanvas
          enrollment={approve}
          onClose={() => closeModal('approve')}
          isSubmitting={approveEnrollmentMutation.isPending}
          onApprove={(enrollment, selectedPlans, approvedBy, tier) => {
            approveEnrollmentMutation.mutate(
              {
                enrollment: { ...enrollment, approvedBy },
                planIds: selectedPlans.map((p) => p.id),
                tier,
              },
              { onSuccess: () => closeModal('approve') }
            );
          }}
        />
      )}

      {editPlan && (
        <ApproveOffcanvas
          enrollment={editPlan}
          title="Edit Plan"
          subtitle="Select plan(s) and save changes"
          confirmLabel="Save"
          onClose={() => closeModal('editPlan')}
          isSubmitting={editPlanSelectionMutation.isPending}
          onApprove={(enrollment, selectedPlans, _approvedBy, tier) => {
            editPlanSelectionMutation.mutate(
              {
                enrollment: { ...enrollment, planId: selectedPlans[0]?.id ?? enrollment.planId },
                planIds: selectedPlans.map((p) => p.id),
                tier,
              },
              { onSuccess: () => closeModal('editPlan') }
            );
          }}
        />
      )}

      {reject && (
        <RejectModal
          enrollment={reject}
          onClose={() => closeModal('reject')}
          isPending={rejectMutation.isPending}
          onReject={(enrollment, reason) => {
            rejectMutation.mutate(
              { enrollment, reason },
              { onSuccess: () => closeModal('reject') }
            );
          }}
        />
      )}

      {notes && (
        <NotesOffcanvas
          enrollment={notes}
          notes={notesQuery.data}
          isLoading={notesQuery.isLoading}
          isPending={addNoteMutation.isPending}
          onClose={() => closeModal('notes')}
          onAddNote={(enrollment, noteText) => {
            addNoteMutation.mutate({ policyId: enrollment.policyId, noteText });
          }}
        />
      )}

      {emailLogs && (
        <EmailLogsOffcanvas enrollment={emailLogs} onClose={() => closeModal('emailLogs')} />
      )}

      {activate && (
        <ActivateModal
          enrollment={activate}
          onClose={() => closeModal('activate')}
          isPending={activateMutation.isPending}
          onActivate={(enrollment) => {
            activateMutation.mutate(enrollment, {
              onSuccess: () => closeModal('activate'),
            });
          }}
        />
      )}

      {revert && (
        <RevertModal
          enrollment={revert}
          onClose={() => closeModal('revert')}
          isPending={revertMutation.isPending}
          onRevert={(enrollment) => {
            revertMutation.mutate(enrollment, {
              // Close the modal on success; toast is handled by the mutation itself
              onSuccess: () => closeModal('revert'),
            });
          }}
        />
      )}

      {reminder && (
        <ReminderModal
          enrollment={reminder}
          onClose={() => closeModal('reminder')}
          isPending={reminderMutation.isPending}
          onSend={(enrollment) =>
            reminderMutation.mutate(String(enrollment.id), {
              onSuccess: () => closeModal('reminder'),
            })
          }
        />
      )}

      {resendSignature && (
        <ResendSignatureModal
          enrollment={resendSignature}
          onClose={() => closeModal('resendSignature')}
          isPending={resendSignatureMutation.isPending}
          onResend={(enrollment) =>
            resendSignatureMutation.mutate(String(enrollment.id), {
              onSuccess: () => closeModal('resendSignature'),
            })
          }
        />
      )}
    </>
  );
}
