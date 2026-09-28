import { useNavigate } from 'react-router-dom';
import { EnrollmentActions } from './EnrollmentActions';
import { useEnrollments } from '../hooks/useEnrollments';
import { useEnrollmentStore } from '@/stores/enrollmentStore';
import { ROUTES } from '@/app/router/routeConfig';
import { downloadFileFromUrl } from '@/shared/utils';
import type { Enrollment } from '../types';

interface Props {
  enrollment: Enrollment;
}

export function EnrollmentActionsContainer({ enrollment }: Props) {
  const { drawer } = useEnrollments();
  const { openModal } = useEnrollmentStore();
  const navigate = useNavigate();

  return (
    <EnrollmentActions
      enrollment={enrollment}
      onOpenDrawer={drawer.openDrawer}
      onAskQuestion={(e) => openModal('askQuestion', e)}
      onApprove={(e) => openModal('approve', e)}
      onEditPlan={(e) => openModal('editPlan', e)}
      onReject={(e) => openModal('reject', e)}
      onReminder={(e) => openModal('reminder', e)}
      onActivate={(e) => openModal('activate', e)}
      onRevert={(e) => openModal('revert', e)}
      onResendSignature={(e) => openModal('resendSignature', e)}
      onNotes={(e) => openModal('notes', e)}
      onEmails={(e) => openModal('emailLogs', e)}
      onVerifySignature={(e) => navigate(`${ROUTES.PLAN_SELECTION_ADMIN}?id=${e.id}`)}
      onDownloadContract={(e) => {
        if (e.contractDownloadUrl) {
          downloadFileFromUrl(e.contractDownloadUrl, `Contract - ${e.name} - ${e.policyId}.pdf`);
        }
      }}
    />
  );
}
