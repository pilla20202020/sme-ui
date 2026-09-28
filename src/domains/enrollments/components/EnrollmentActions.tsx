import { useTheme } from '@/app/providers/ThemeContext';
import type { Enrollment } from '@/domains/enrollments/types';
import {
  HiOutlineClipboardList,
  HiOutlineChatAlt2,
  HiOutlineBadgeCheck,
  HiOutlineXCircle,
  HiOutlineBell,
  HiOutlineReply,
  HiOutlinePaperAirplane,
  HiOutlineLightningBolt,
  HiOutlineAnnotation,
  HiOutlineMailOpen,
  HiOutlineShieldCheck,
  HiOutlineDownload,
} from 'react-icons/hi';
import styles from '../pages/EnrollmentsPage.module.css';

interface EnrollmentActionsProps {
  enrollment: Enrollment;
  onOpenDrawer: (enrollment: Enrollment) => void;
  onAskQuestion: (enrollment: Enrollment) => void;
  onApprove: (enrollment: Enrollment) => void;
  onEditPlan: (enrollment: Enrollment) => void;
  onReject: (enrollment: Enrollment) => void;
  onReminder: (enrollment: Enrollment) => void;
  onActivate: (enrollment: Enrollment) => void;
  onRevert: (enrollment: Enrollment) => void;
  onResendSignature: (enrollment: Enrollment) => void;
  onNotes: (enrollment: Enrollment) => void;
  onEmails: (enrollment: Enrollment) => void;
  onVerifySignature: (enrollment: Enrollment) => void;
  onDownloadContract: (enrollment: Enrollment) => void;
}

type ActionColor = 'green' | 'red' | 'amber' | 'blue' | 'violet';

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  actionColor?: ActionColor;
  showNewBadge?: boolean;
}

export function EnrollmentActions({
  enrollment,
  onOpenDrawer,
  onAskQuestion,
  onApprove,
  onEditPlan,
  onReject,
  onReminder,
  onActivate,
  onRevert,
  onResendSignature,
  onNotes,
  onEmails,
  onVerifySignature,
  onDownloadContract,
}: EnrollmentActionsProps) {
  useTheme();

  const status = enrollment.status;

  const actions: ActionItem[] = [];

  actions.push({
    label: 'View Report',
    icon: <HiOutlineClipboardList />,
    onClick: () => onOpenDrawer(enrollment),
  });
  if (status === 'Pending Underwriting') {
    actions.push({
      label: 'Questionaire',
      icon: <HiOutlineChatAlt2 />,
      onClick: () => onAskQuestion(enrollment),
      actionColor: 'blue',
      showNewBadge: enrollment.answeredQuestions,
    });
    actions.push({
      label: 'Edit Plan and Approve',
      icon: <HiOutlineBadgeCheck />,
      onClick: () => onApprove(enrollment),
      actionColor: 'green',
    });
    actions.push({
      label: 'Reject',
      icon: <HiOutlineXCircle />,
      onClick: () => onReject(enrollment),
      actionColor: 'red',
    });
  }
  if (status === 'Pending Response') {
    actions.push({
      label: 'Ask Question',
      icon: <HiOutlineChatAlt2 />,
      onClick: () => onAskQuestion(enrollment),
      actionColor: 'blue',
      showNewBadge: enrollment.answeredQuestions,
    });
    actions.push({
      label: 'Send Reminder',
      icon: <HiOutlineBell />,
      onClick: () => onReminder(enrollment),
      actionColor: 'amber',
    });
    actions.push({
      label: 'Reject',
      icon: <HiOutlineXCircle />,
      onClick: () => onReject(enrollment),
      actionColor: 'red',
    });
  }
  if (status === 'Pending Signature') {
    actions.push({
      label: 'Verify & Signature',
      icon: <HiOutlineShieldCheck />,
      onClick: () => onVerifySignature(enrollment),
      actionColor: 'blue',
    });
    actions.push({
      label: 'Edit Plan and Approve',
      icon: <HiOutlineBadgeCheck />,
      onClick: () => onEditPlan(enrollment),
      actionColor: 'green',
    });
    actions.push({
      label: 'Revert',
      icon: <HiOutlineReply />,
      onClick: () => onRevert(enrollment),
      actionColor: 'amber',
    });
    actions.push({
      label: 'Resend',
      icon: <HiOutlinePaperAirplane />,
      onClick: () => onResendSignature(enrollment),
      actionColor: 'violet',
    });
    actions.push({
      label: 'Reject',
      icon: <HiOutlineXCircle />,
      onClick: () => onReject(enrollment),
      actionColor: 'red',
    });
  }
  if (status === 'Ready to Activate') {
    actions.push({
      label: 'Activate',
      icon: <HiOutlineLightningBolt />,
      onClick: () => onActivate(enrollment),
      actionColor: 'green',
    });
    actions.push({
      label: 'Revert',
      icon: <HiOutlineReply />,
      onClick: () => onRevert(enrollment),
      actionColor: 'amber',
    });
    actions.push({
      label: 'Reject',
      icon: <HiOutlineXCircle />,
      onClick: () => onReject(enrollment),
      actionColor: 'red',
    });
  }
  if (status === 'Active') {
    actions.push({
      label: 'Revert',
      icon: <HiOutlineReply />,
      onClick: () => {
        if (!enrollment.invoicePaid) onRevert(enrollment);
      },
      disabled: enrollment.invoicePaid,
      actionColor: 'amber',
    });
    if (enrollment.contractDownloadUrl) {
      actions.push({
        label: 'Download Contract',
        icon: <HiOutlineDownload />,
        onClick: () => onDownloadContract(enrollment),
        actionColor: 'blue',
      });
    }
  }
  if (status === 'Declined by UW' || status === 'Declined by Member') {
    actions.push({
      label: 'Revert',
      icon: <HiOutlineReply />,
      onClick: () => onRevert(enrollment),
      actionColor: 'amber',
    });
  }

  actions.push({
    label: 'Notes',
    icon: <HiOutlineAnnotation />,
    onClick: () => onNotes(enrollment),
  });
  actions.push({
    label: 'Email Logs',
    icon: <HiOutlineMailOpen />,
    onClick: () => onEmails(enrollment),
  });

  return (
    <div className={styles.actionInlineRow}>
      {actions.map((item) => (
        <button
          key={item.label}
          className={styles.actionInlineBtn}
          onClick={item.onClick}
          disabled={item.disabled}
          data-action-color={item.actionColor ?? 'default'}
          title={item.label}
          aria-label={item.label}
        >
          {item.icon}
          {item.showNewBadge && <span className={styles.actionInlineDot} />}
        </button>
      ))}
    </div>
  );
}
