import { useState, useMemo, useEffect } from 'react';
import { HiOutlineX, HiOutlineCheckCircle, HiOutlineSearch } from 'react-icons/hi';
import type { Enrollment } from '@/domains/enrollments/types';
import type { Plan } from '@/shared/constants';
import { formatCurrency } from '@/shared/utils';
import { useL713Plans } from '../../hooks/use-l713-plans';
import { useAuth } from '@/app/providers/AuthContext';
import { Spinner } from '@/shared/components/ui/Spinner';
import styles from './ApproveOffcanvas.module.css';

interface ApproveOffcanvasProps {
  enrollment: Enrollment;
  onClose: () => void;
  onApprove: (
    enrollment: Enrollment,
    selectedPlans: Plan[],
    approvedBy: string,
    tier: string
  ) => void;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
}

function PlanSkeleton() {
  return (
    <div className={styles.planSkeleton}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.planSkeletonRow}>
          <div className={styles.planSkeletonBox} />
          <div className={styles.planSkeletonBody}>
            <div className={styles.planSkeletonLine} />
            <div className={`${styles.planSkeletonLine} ${styles.planSkeletonShort}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ApproveOffcanvas({
  enrollment,
  onClose,
  onApprove,
  title = 'Approve Enrollment',
  subtitle = 'Select plan(s) and confirm approval',
  confirmLabel = 'Approve',
  isSubmitting = false,
}: ApproveOffcanvasProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(() => {
    const ids = new Set([
      ...(enrollment.plan && !enrollment.plan.isRemoved ? [enrollment.plan.id] : []),
      ...enrollment.enrollmentPlans.map((p) => p.id),
      ...enrollment.selectedPlanIds,
    ]);
    return [...ids];
  });

  const { data: livePlans = [], isLoading, isError, refetch } = useL713Plans(enrollment.policyId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, isSubmitting]);

  // All plan IDs that belong to this enrollment (for deduplication in otherPlans)
  const enrollmentPlanIds = useMemo(
    () => new Set(enrollment.enrollmentPlans.map((p) => p.id)),
    [enrollment.enrollmentPlans]
  );

  // Current plan: prefer live data, fall back to enrollment.plan from API
  const currentPlan = enrollment.plan;

  // Enrollment plans excluding the current plan (rendered from enrollment data directly)
  const enrollmentNonCurrentPlans = useMemo(
    () => enrollment.enrollmentPlans.filter((p) => p.id !== enrollment.plan?.id),
    [enrollment.enrollmentPlans, enrollment.plan?.id]
  );

  // Ids of plans that are add-ons already attached to this enrollment (not the primary plan) —
  // used to identify which selected plan is the primary one when submitting.
  const enrollmentNonCurrentPlanIds = useMemo(
    () => new Set(enrollmentNonCurrentPlans.map((p) => p.id)),
    [enrollmentNonCurrentPlans]
  );

  // Additional plans from the API: exclude current plan and any enrollment_plans
  const otherPlans = useMemo(() => {
    const q = search.toLowerCase();
    return livePlans.filter(
      (p) =>
        p.id !== enrollment.plan?.id &&
        !enrollmentPlanIds.has(p.id) &&
        (q === '' ||
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.tier.toLowerCase().includes(q))
    );
  }, [livePlans, search, enrollment.plan?.id, enrollmentPlanIds]);

  // Combined plan lookup for resolving selected IDs on submit
  const allPlansById = useMemo(() => {
    const map = new Map<string, Plan>();
    livePlans.forEach((p) => map.set(p.id, p));
    enrollment.enrollmentPlans.forEach((p) => map.set(p.id, p));
    if (currentPlan) map.set(currentPlan.id, currentPlan);
    return map;
  }, [livePlans, enrollment.enrollmentPlans, currentPlan]);

  // The primary plan among the current selection: whichever selected plan isn't one of the
  // enrollment's existing add-ons. Its tier is what gets submitted with the approval.
  const primaryPlan = useMemo(
    () =>
      selected
        .map((id) => allPlansById.get(id))
        .find((p): p is Plan => p !== undefined && !enrollmentNonCurrentPlanIds.has(p.id)),
    [selected, allPlansById, enrollmentNonCurrentPlanIds]
  );

  function togglePlan(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
  }

  function handleApprove() {
    if (!primaryPlan) return;
    const selectedPlans = selected
      .map((id) => allPlansById.get(id))
      .filter((p): p is Plan => p !== undefined);
    const approvedBy = user ? `${user.firstName} ${user.lastName}`.trim() : '';
    onApprove(enrollment, selectedPlans, approvedBy, primaryPlan.tier);
  }

  return (
    <>
      <div className={styles.backdrop} onClick={isSubmitting ? undefined : onClose} />
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <HiOutlineCheckCircle />
            </div>
            <div>
              <div className={styles.headerTitle}>{title}</div>
              <div className={styles.headerSubtitle}>{subtitle}</div>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <HiOutlineX />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <HiOutlineSearch className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name, ID or tier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className={styles.searchClear}
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <HiOutlineX />
              </button>
            )}
          </div>

          {/* Plans List */}
          <div className={styles.planList}>
            <div className={styles.planListHeader}>
              <span>Available L713 Plans</span>
              <span className={styles.selCount}>{selected.length} selected</span>
            </div>

            <div className={styles.planListScroll}>
              {isLoading ? (
                <PlanSkeleton />
              ) : isError ? (
                <div className={styles.plansError}>
                  <span>Failed to load plans.</span>
                  <button className={styles.retryBtn} onClick={() => refetch()}>
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {/* Current plan - pinned at top, but can still be unchecked to remove */}
                  {currentPlan && (
                    <>
                      <div className={styles.planSectionLabel}>Current Plan</div>
                      <label
                        className={`${styles.planItem} ${selected.includes(currentPlan.id) ? styles.planItemSelected : ''}`}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={selected.includes(currentPlan.id)}
                          onChange={() => togglePlan(currentPlan.id)}
                        />
                        <div className={styles.planItemBody}>
                          <div className={styles.planItemTop}>
                            <div className={styles.planItemName}>
                              {currentPlan.name}/{currentPlan.tier}
                            </div>
                            <div className={styles.planItemPremium}>
                              {formatCurrency(currentPlan.premium)}
                              <span>/mo</span>
                            </div>
                          </div>
                          <div className={styles.planItemMeta}>
                            <span className={styles.planItemId}>{currentPlan.carrier}</span>
                            <span className={styles.currentTag}>Current</span>
                          </div>
                        </div>
                      </label>
                    </>
                  )}

                  {/* Enrollment plans - pre-selected, rendered from enrollment data */}
                  {enrollmentNonCurrentPlans.length > 0 && (
                    <>
                      <div className={styles.planSectionLabel}>Enrollment Plans</div>
                      {enrollmentNonCurrentPlans.map((plan) => {
                        const isSelected = selected.includes(plan.id);
                        return (
                          <label
                            key={plan.id}
                            className={`${styles.planItem} ${isSelected ? styles.planItemSelected : ''}`}
                          >
                            <input
                              type="checkbox"
                              className={styles.checkbox}
                              checked={isSelected}
                              onChange={() => togglePlan(plan.id)}
                            />
                            <div className={styles.planItemBody}>
                              <div className={styles.planItemTop}>
                                <div className={styles.planItemName}>
                                  {plan.name}/{plan.tier}
                                </div>
                                <div className={styles.planItemPremium}>
                                  {formatCurrency(plan.premium)}
                                  <span>/mo</span>
                                </div>
                              </div>
                              <div className={styles.planItemMeta}>
                                <span className={styles.planItemId}>{plan.carrier}</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </>
                  )}

                  {/* Other plans from API */}
                  {otherPlans.length > 0 && (
                    <div className={styles.planSectionLabel}>Other Plans</div>
                  )}
                  {otherPlans.map((plan) => {
                    const isSelected = selected.includes(plan.id);
                    return (
                      <label
                        key={plan.id}
                        className={`${styles.planItem} ${isSelected ? styles.planItemSelected : ''}`}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => togglePlan(plan.id)}
                        />
                        <div className={styles.planItemBody}>
                          <div className={styles.planItemTop}>
                            <div className={styles.planItemName}>
                              {plan.name}/{plan.tier}
                            </div>
                            <div className={styles.planItemPremium}>
                              {formatCurrency(plan.premium)}
                              <span>/mo</span>
                            </div>
                          </div>
                          <div className={styles.planItemMeta}>
                            <span className={styles.planItemId}>{plan.carrier}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}

                  {!currentPlan && otherPlans.length === 0 && (
                    <div className={styles.emptySearch}>No plans match your search</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {selected.length > 0 && !primaryPlan && (
          <div style={{ padding: '0 24px', fontSize: 12, color: 'var(--color-red)' }}>
            Select a primary plan to approve.
          </div>
        )}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className={styles.approveBtn}
            onClick={handleApprove}
            disabled={selected.length === 0 || !primaryPlan || isLoading || isSubmitting}
          >
            {isSubmitting ? (
              <Spinner size="xs" color="#ffffff" trackColor="rgba(255,255,255,0.35)" decorative />
            ) : (
              <HiOutlineCheckCircle />
            )}
            {isSubmitting ? 'Submitting...' : confirmLabel}
            {!isSubmitting && selected.length > 1 ? ` (${selected.length})` : ''}
          </button>
        </div>
      </div>
    </>
  );
}
