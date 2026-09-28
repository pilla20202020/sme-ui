import {
  AskQuestionModal,
  EditPlanModal,
  ApproveOffcanvas,
  RejectModal,
  NotesOffcanvas,
  EmailLogsOffcanvas,
  ActivateModal,
  RevertModal,
  ReminderModal,
  ResendSignatureModal,
} from '@/domains/enrollments/components/modals';
import { approveEnrollment, changeEnrollmentStatus } from '@/domains/enrollments/api/enrollmentApi';
import type { Enrollment } from '@/domains/enrollments/types';
import type { Plan } from '@/shared/constants';
import type { EnrollmentModalsHandle } from '@/domains/enrollments/hooks/useEnrollmentModals';

interface EnrollmentModalsProps {
  enrollments: Enrollment[];
  modals: EnrollmentModalsHandle;
  onUpdateEnrollment: (updated: Enrollment) => void;
}

export function EnrollmentModals({
  enrollments,
  modals,
  onUpdateEnrollment,
}: EnrollmentModalsProps) {
  function findEnrollment(key: string): Enrollment | undefined {
    return enrollments.find((e) => e.key === key);
  }

  async function handleApproval(
    enrollment: Enrollment,
    selectedPlans: Plan[],
    approvedBy: string,
    tier: string
  ) {
    const found = findEnrollment(enrollment.key);
    if (!found) return;

    await approveEnrollment({
      policyId: Number(found.policyId),
      planIds: selectedPlans.map((p) => p.id),
      tier,
    });

    onUpdateEnrollment({
      ...found,
      planId: selectedPlans[0]?.id ?? found.planId,
      status: 'Pending Signature',
      approvedBy,
    });

    modals.close('approve');
  }

  return (
    <>
      {modals.askQuestion && (
        <AskQuestionModal
          enrollment={modals.askQuestion}
          onClose={() => modals.close('askQuestion')}
          onSend={(enrollment) => {
            const current = findEnrollment(enrollment.key) ?? enrollment;
            onUpdateEnrollment({
              ...current,
              status:
                current.status === 'Pending Underwriting' ? 'Pending Response' : current.status,
            });
            modals.close('askQuestion');
          }}
        />
      )}

      {modals.approve && (
        <ApproveOffcanvas
          enrollment={modals.approve}
          onClose={() => modals.close('approve')}
          onApprove={handleApproval}
        />
      )}

      {modals.editPlan && (
        <EditPlanModal
          enrollment={modals.editPlan}
          onClose={() => modals.close('editPlan')}
          onSave={(enrollment, planId) => {
            const found = findEnrollment(enrollment.key);
            if (found) onUpdateEnrollment({ ...found, planId, status: 'Pending Signature' });
            modals.close('editPlan');
          }}
        />
      )}

      {modals.reject && (
        <RejectModal
          enrollment={modals.reject}
          onClose={() => modals.close('reject')}
          onReject={(enrollment) => {
            onUpdateEnrollment({ ...enrollment, status: 'Declined by UW' });
            modals.close('reject');
          }}
        />
      )}

      {modals.notes && (
        <NotesOffcanvas
          enrollment={modals.notes}
          onClose={() => modals.close('notes')}
          onAddNote={() => modals.close('notes')}
        />
      )}

      {modals.emailLogs && (
        <EmailLogsOffcanvas
          enrollment={modals.emailLogs}
          onClose={() => modals.close('emailLogs')}
        />
      )}

      {modals.activate && (
        <ActivateModal
          enrollment={modals.activate}
          onClose={() => modals.close('activate')}
          onActivate={(enrollment) => {
            onUpdateEnrollment({ ...enrollment, status: 'Active' });
            modals.close('activate');
          }}
        />
      )}

      {modals.revert && (
        <RevertModal
          enrollment={modals.revert}
          onClose={() => modals.close('revert')}
          onRevert={async (enrollment) => {
            console.log(
              `[Revert] Calling change-status API — policyId: ${Number(enrollment.policyId)}, action: "REVERT"`
            );
            try {
              await changeEnrollmentStatus(enrollment.policyId, 'REVERT');
              console.log(
                `[Revert] Success — "${enrollment.name}" (${enrollment.policyId}) → Pending Underwriting`
              );
            } catch (err) {
              console.error(`[Revert] Failed — policyId: "${enrollment.policyId}"`, err);
              return;
            }
            onUpdateEnrollment({ ...enrollment, status: 'Pending Underwriting' });
            modals.close('revert');
          }}
        />
      )}

      {modals.reminder && (
        <ReminderModal
          enrollment={modals.reminder}
          onClose={() => modals.close('reminder')}
          onSend={() => modals.close('reminder')}
        />
      )}

      {modals.resendSignature && (
        <ResendSignatureModal
          enrollment={modals.resendSignature}
          onClose={() => modals.close('resendSignature')}
          onResend={() => modals.close('resendSignature')}
        />
      )}
    </>
  );
}
