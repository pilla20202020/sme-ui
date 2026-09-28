import type { Enrollment } from '@/domains/enrollments/types';
import styles from './ReminderModal.module.css';
import {
  HiOutlineBell,
  HiOutlineClipboardList,
  HiOutlineIdentification,
  HiOutlineMail,
  HiOutlineX,
} from 'react-icons/hi';

interface ReminderModalProps {
  enrollment: Enrollment;
  onClose: () => void;
  onSend: (enrollment: Enrollment) => void;
  isPending?: boolean;
}

export function ReminderModal({ enrollment, onClose, onSend, isPending }: ReminderModalProps) {
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
              <div className={styles.headerTitle}>Send Reminder</div>
              <div className={styles.headerSubtitle}>
                Send a reminder to complete the pending enrollment.
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
            A reminder email will be sent to <strong>{enrollment.email}</strong> regarding their
            pending enrollment.
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
            The email will include a secure link for the member to complete or respond to any
            outstanding questions before proceeding.
          </p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.rejectBtn}
            onClick={() => onSend(enrollment)}
            disabled={isPending}
          >
            {isPending ? 'Sending…' : 'Send Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
}
