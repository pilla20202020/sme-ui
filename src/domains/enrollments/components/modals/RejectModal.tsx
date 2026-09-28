import { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineBan } from 'react-icons/hi';
import type { Enrollment } from '@/domains/enrollments/types';
import styles from './RejectModal.module.css';
import { StatusBadge } from '@/shared/components/ui';
import { Spinner } from '@/shared/components/ui/Spinner';

interface RejectModalProps {
  enrollment: Enrollment;
  onClose: () => void;
  onReject: (enrollment: Enrollment, reason: string, notes: string) => void;
  isPending?: boolean;
}

export function RejectModal({
  enrollment,
  onClose,
  onReject,
  isPending = false,
}: RejectModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleConfirm() {
    onReject(enrollment, reason, '');
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}>
                <HiOutlineBan />
              </div>
              <div>
                <div className={styles.headerTitle}>Reject Enrollment</div>
                <div className={styles.headerSubtitle}>Provide a reason to reject this member</div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <HiOutlineX />
            </button>
          </div>

          {/* Body */}
          <div className={styles.body}>
            {/* Member Details */}
            <div className={styles.memberCard}>
              <div className={styles.memberCardHeader}>Member Details</div>
              <div className={styles.memberCardBody}>
                <div className={`${styles.memberTop} ${styles['mb-zero']}`}>
                  <div>
                    <div className={styles.memberName}>{enrollment.name}</div>
                    <div className={styles.memberSysId}>{enrollment.policyId}</div>
                  </div>
                  <StatusBadge status={enrollment.status} />
                </div>
              </div>
            </div>

            <div>
              <div className={styles.sectionLabel}>Rejection Reason</div>
              <div className={styles.reasonCard}>
                <textarea
                  className={styles.textarea}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the reason for rejecting this enrollment..."
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button className={styles.rejectBtn} onClick={handleConfirm} disabled={isPending}>
              {isPending && (
                <Spinner size="xs" color="#ffffff" trackColor="rgba(255,255,255,0.35)" decorative />
              )}
              {isPending ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
