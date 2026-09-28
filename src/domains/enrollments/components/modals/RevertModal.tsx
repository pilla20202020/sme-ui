import type { Enrollment } from '@/domains/enrollments/types';
import {
  HiOutlineClipboardList,
  HiOutlineIdentification,
  HiOutlineMail,
  HiOutlineReply,
  HiOutlineX,
} from 'react-icons/hi';
import { Spinner } from '@/shared/components/ui/Spinner';
import styles from './ReminderModal.module.css';

interface RevertModalProps {
  enrollment: Enrollment;
  onClose: () => void;
  onRevert: (enrollment: Enrollment, notify: boolean) => void;
  isPending?: boolean;
}

export function RevertModal({
  enrollment,
  onClose,
  onRevert,
  isPending = false,
}: RevertModalProps) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <HiOutlineReply />
            </div>
            <div>
              <div className={styles.headerTitle}>Revert Enrollment</div>
              <div className={styles.headerSubtitle}>
                Move the member back to Pending Underwriting.
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
            This will move <strong>{enrollment.name}</strong> back to Pending Underwriting.
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
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            className={styles.rejectBtn}
            onClick={() => onRevert(enrollment, false)}
            disabled={isPending}
          >
            {isPending && (
              <Spinner size="xs" color="#ffffff" trackColor="rgba(255,255,255,0.35)" decorative />
            )}
            {isPending ? 'Reverting…' : 'Revert'}
          </button>
        </div>
      </div>
    </div>
  );
}
