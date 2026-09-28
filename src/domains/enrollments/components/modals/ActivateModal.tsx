import type { Enrollment } from '@/domains/enrollments/types';
import {
  HiOutlineCheckCircle,
  HiOutlineClipboardList,
  HiOutlineIdentification,
  HiOutlineMail,
  HiOutlineX,
} from 'react-icons/hi';
import { Spinner } from '@/shared/components/ui/Spinner';
import styles from './ReminderModal.module.css';

interface ActivateModalProps {
  enrollment: Enrollment;
  onClose: () => void;
  onActivate: (enrollment: Enrollment) => void;
  isPending?: boolean;
}

export function ActivateModal({
  enrollment,
  onClose,
  onActivate,
  isPending = false,
}: ActivateModalProps) {
  function handleActivate() {
    onActivate(enrollment);
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <HiOutlineCheckCircle />
            </div>
            <div>
              <div className={styles.headerTitle}>Activate Enrollment</div>
              <div className={styles.headerSubtitle}>
                Please confirm the details before activating.
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
            You are about to activate the enrollment for <strong>{enrollment.name}</strong>. This
            action will mark the case as active.
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

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button className={styles.rejectBtn} onClick={handleActivate} disabled={isPending}>
            {isPending && (
              <Spinner size="xs" color="#ffffff" trackColor="rgba(255,255,255,0.35)" decorative />
            )}
            {isPending ? 'Activating…' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}
