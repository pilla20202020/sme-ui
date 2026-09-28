import type { Enrollment } from '@/domains/enrollments/types';
import styles from './ReminderModal.module.css';
import {
  HiOutlineBell,
  HiOutlineClipboardList,
  HiOutlineIdentification,
  HiOutlineMail,
  HiOutlineX,
} from 'react-icons/hi';

interface ResendSignatureModalProps {
  enrollment: Enrollment;
  onClose: () => void;
  onResend: (enrollment: Enrollment) => void;
  isPending?: boolean;
}

export function ResendSignatureModal({
  enrollment,
  onClose,
  onResend,
  isPending,
}: ResendSignatureModalProps) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <HiOutlineBell />
            </div>
            <div>
              <div className={styles.headerTitle}>Resend Signature Request</div>
              <div className={styles.headerSubtitle}>
                Resend a signature request email to the member.
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <HiOutlineX />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <p className={styles.reminderText}>
            A signature request email will be resent to <strong>{enrollment.email}</strong> .
          </p>
          {/* Member Details */}
          <div className={styles.memberCard}>
            <div className={styles.memberCardHeader}>Member Details</div>
            <div className={styles.memberCardBody}>
              <div className={styles.memberName}>{enrollment.name}</div>
              <div className={styles.memberGrid}>
                <div className={styles.memberField}>
                  <span className={styles.memberFieldIcon}>
                    <HiOutlineIdentification />
                  </span>
                  <div>
                    <div className={styles.memberFieldLabel}>{enrollment.policyId}</div>
                    <div className={styles.memberFieldSub}>Member ID</div>
                  </div>
                </div>
                <div className={styles.memberField}>
                  <span className={styles.memberFieldIcon}>
                    <HiOutlineClipboardList />
                  </span>
                  <div>
                    <div className={styles.memberFieldLabel}>{enrollment.planName}</div>
                    <div className={styles.memberFieldSub}>Plan</div>
                  </div>
                </div>
                <div className={styles.memberField}>
                  <span className={styles.memberFieldIcon}>
                    <HiOutlineMail />
                  </span>
                  <div>
                    <div className={styles.memberFieldLabel}>{enrollment.email}</div>
                    <div className={styles.memberFieldSub}>Email</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className={styles.reminderText}>
            The email will contain a secure link for the member to review and sign their enrollment
            documents.
          </p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.rejectBtn}
            onClick={() => onResend(enrollment)}
            disabled={isPending}
          >
            {isPending ? 'Sending…' : 'Send Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
}
