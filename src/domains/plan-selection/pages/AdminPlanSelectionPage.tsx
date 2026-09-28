import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { ROUTES } from '@/app/router/routeConfig';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { useAdminPlanSelectionQuery } from '../data/use-admin-plan-selection.query';
import { useSubmitPlanSelectionMutation } from '../data/use-submit-plan-selection.mutation';
import { SignatureCanvas, type SignatureCanvasHandle } from '../components/SignatureCanvas';
import { PlanSelectionSkeleton } from '../components/PlanSelectionSkeleton';
import { formatDate } from '@/shared/utils';
import styles from './PlanSelectionPage.module.css';

function planDisplayName(plan: { name: string; tier: string | null } | undefined | null): string {
  if (!plan) return '';
  return plan.tier ? `${plan.name}/${plan.tier}` : plan.name;
}

function planPrice(
  plan: { premium: number; planPricings?: { price: number }[] } | undefined | null
): number {
  if (!plan) return 0;
  return plan.planPricings?.[0]?.price ?? plan.premium;
}

export function AdminPlanSelectionPage() {
  const { T } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const enrollmentId = Number(searchParams.get('id')) || null;
  const { data, isLoading } = useAdminPlanSelectionQuery(enrollmentId);

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const sigRef = useRef<SignatureCanvasHandle>(null);

  // 23rd cutoff: on or before → 1st of next month; after → 1st of month after next
  const effectiveDate = useMemo(() => {
    const today = new Date();
    const monthsAhead = today.getDate() <= 23 ? 1 : 2;
    const d = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-01`;
  }, []);

  useEffect(() => {
    if (data && !selectedPlanId) {
      setSelectedPlanId(data.currentPlanId);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = () =>
    navigate(ROUTES.ENROLLMENTS, { state: { filterStatus: 'Pending Signature' } });

  const { mutate: submitSelection, isPending: submitting } = useSubmitPlanSelectionMutation();

  const allPlans = useMemo(() => {
    if (!data) return [];
    return [...data.availablePlans, ...(data.selectedPlan ? [data.selectedPlan] : [])].filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
    );
  }, [data]);

  const selectedPlan = useMemo(
    () => allPlans.find((p) => p.id === selectedPlanId),
    [allPlans, selectedPlanId]
  );

  const computedPayment = useMemo(() => {
    const enrollmentFee = data?.enrollment.payment?.enrollmentFee ?? 0;
    const premium = selectedPlan
      ? planPrice(selectedPlan)
      : (data?.enrollment.payment?.recurringMonthTotal ?? 0);
    return {
      enrollmentFee,
      firstMonthTotal: +(enrollmentFee + premium).toFixed(2),
      recurringMonthTotal: +premium.toFixed(2),
    };
  }, [selectedPlan, data]);

  const canSubmit = Boolean(!submitting && selectedPlan && effectiveDate && hasDrawn);

  function handleSubmit() {
    if (!canSubmit || !data || !selectedPlan) return;
    const imageData = sigRef.current?.getImageData() ?? undefined;
    setSubmitError(null);
    submitSelection(
      {
        policyId: data.policyId,
        selectedPlanId: selectedPlan.id,
        effectiveDate,
        signatureData: imageData,
      },
      {
        onSuccess: () => {
          toast.success('Plan selection submitted successfully.');
          navigate(ROUTES.ENROLLMENTS, { state: { filterStatus: 'Ready to Activate' } });
        },
        onError: (err) => setSubmitError(err instanceof Error ? err.message : 'Submission failed'),
      }
    );
  }

  if (isLoading) {
    return (
      <div
        style={{ background: T.bg, minHeight: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Topbar title="Plan Selection Preview" />
        <div style={{ flex: 1, maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
          <div style={{ padding: '22px 24px 36px' }}>
            <PlanSelectionSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!enrollmentId || !data) {
    return (
      <div style={{ background: T.bg, minHeight: '100%' }}>
        <Topbar title="Plan Selection Preview" />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 32px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 8 }}>
              Enrollment Unavailable
            </div>
            <p style={{ color: T.textMuted, fontSize: 14 }}>
              This enrollment record could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { member, enrollment, representative } = data;
  const currentPlanId = data.currentPlanId;

  return (
    <div
      style={{
        background: T.bg,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Topbar title="Plan Selection Preview" subtitle={`Policy #${data.policyId} · Admin View`} />
      <div
        style={{
          flex: 1,
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        <div style={{ padding: '22px 24px 36px' }}>
          <div className={styles.heroCard}>
            <button type="button" className={styles.backLink} onClick={handleBack}>
              <HiOutlineArrowLeft />
              <span>Back</span>
            </button>
            <h1 className={styles.heroTitle} style={{ color: T.text }}>
              Pending Enrollment Verification and Authorization
            </h1>
            <p className={styles.heroBody} style={{ color: T.textMuted }}>
              You have been enrolled in the following plan(s). Please review your enrollment
              information below. To complete and authorize your enrollment, please agree, sign &amp;
              complete below.
            </p>
          </div>

          <div className={styles.twoCol}>
            <section className={styles.colContent}>
              {/* Current Selection */}
              <div
                className={styles.sectionCard}
                style={{ borderColor: T.border, background: T.bgCard }}
              >
                <div className={styles.sectionLabel} style={{ color: T.text }}>
                  <HiOutlineCheckCircle size={15} />
                  Current Selection
                </div>
                <div
                  className={styles.selectedPlanHero}
                  style={{ borderColor: T.border, background: T.bgAlt }}
                >
                  <div>
                    <div className={styles.selectedPlanEyebrow} style={{ color: T.textMuted }}>
                      Enrolled Plan
                    </div>
                    <div className={styles.selectedPlanName} style={{ color: T.text }}>
                      {selectedPlan ? planDisplayName(selectedPlan) : 'No plan selected'}
                    </div>
                    <div className={styles.selectedPlanMeta} style={{ color: T.textMuted }}>
                      {selectedPlan
                        ? `${selectedPlan.id} · $${planPrice(selectedPlan).toFixed(2)} / month`
                        : 'Choose a plan below'}
                    </div>
                  </div>
                  <div
                    className={styles.selectedPlanBadge}
                    style={{ background: T.indigoDim, color: T.indigo }}
                  >
                    Selected
                  </div>
                </div>
              </div>

              {/* Plan List */}
              <div
                className={styles.sectionCard}
                style={{ borderColor: T.border, background: T.bgCard }}
              >
                <div className={styles.sectionLabel} style={{ color: T.text }}>
                  <HiOutlineDocumentText size={15} />
                  Please Select A Plan <span style={{ color: '#ef4444' }}>*</span>
                </div>

                <div className={styles.planListScroll}>
                  <div className={styles.planGrid}>
                    {allPlans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      const isCurrent = plan.id === currentPlanId;
                      if (!plan.id) return null;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={styles.planCard}
                          style={{
                            borderColor: isSelected ? T.indigo : T.border,
                            background: isSelected ? T.indigoDim : T.bgCard,
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 3,
                              borderRadius: '13px 13px 0 0',
                              transition: 'background 0.18s',
                            }}
                          />
                          <div className={styles.planCardTop}>
                            <div className={styles.planCardName} style={{ color: T.text }}>
                              {planDisplayName(plan)}
                            </div>
                            <div
                              className={styles.planCardCheck}
                              style={{
                                borderColor: isSelected ? T.indigo : T.border,
                                background: isSelected ? T.indigo : 'transparent',
                              }}
                            >
                              {isSelected && <div className={styles.planCardCheckDot} />}
                            </div>
                          </div>
                          <div
                            className={styles.planCardPrice}
                            style={{ color: isSelected ? T.indigo : T.text }}
                          >
                            ${planPrice(plan).toFixed(2)}
                            <span style={{ fontSize: 11, fontWeight: 400, color: T.textMuted }}>
                              {' '}
                              / mo
                            </span>
                          </div>
                          {isCurrent && (
                            <span
                              className={styles.planCardBadge}
                              style={{ background: T.greenDim, color: T.green }}
                            >
                              Current Plan
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Effective Date */}
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel} style={{ color: T.text }}>
                    <HiOutlineCalendar size={14} /> Effective Date
                  </span>
                  <div
                    className={styles.fieldReadOnly}
                    style={{ color: T.text, background: T.bgAlt, borderColor: T.border }}
                  >
                    {formatDate(effectiveDate) || '—'}
                  </div>
                </div>

                {/* Payment Summary */}
                <div
                  className={styles.payInlineWrap}
                  style={{ borderColor: T.border, background: T.bgAlt }}
                >
                  <div
                    className={styles.payInlineTitle}
                    style={{ color: T.text, borderColor: T.border }}
                  >
                    Payment Summary
                  </div>
                  <div className={styles.payInline}>
                    <div className={styles.payInlineItem}>
                      <span className={styles.payInlineLabel} style={{ color: T.textMuted }}>
                        Enrollment Fee
                      </span>
                      <strong className={styles.payInlineValue} style={{ color: T.text }}>
                        ${computedPayment.enrollmentFee.toFixed(2)}
                      </strong>
                    </div>
                    <div className={styles.payInlineDivider} style={{ background: T.border }} />
                    <div className={styles.payInlineItem}>
                      <span className={styles.payInlineLabel} style={{ color: T.textMuted }}>
                        First Month Total
                      </span>
                      <strong className={styles.payInlineValue} style={{ color: T.text }}>
                        ${computedPayment.firstMonthTotal.toFixed(2)}
                      </strong>
                    </div>
                    <div className={styles.payInlineDivider} style={{ background: T.border }} />
                    <div className={styles.payInlineItem}>
                      <span className={styles.payInlineLabel} style={{ color: T.textMuted }}>
                        Recurring / mo
                      </span>
                      <strong className={styles.payInlineValue} style={{ color: T.indigo }}>
                        ${computedPayment.recurringMonthTotal.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', marginLeft: '8px' }}>
                    *Excluding association fees
                  </span>
                </div>
              </div>

              {/* Signature */}
              <SignatureCanvas ref={sigRef} onDrawChange={setHasDrawn} />

              <div className={styles.footerInner}>
                {submitError && (
                  <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{submitError}</p>
                )}
                <button
                  type="button"
                  className={styles.continueBtn}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{ background: T.indigo }}
                >
                  {submitting ? 'Submitting…' : 'Submit'} <HiOutlineArrowRight size={15} />
                </button>
              </div>
            </section>

            {/* Right column — member overview */}
            <aside className={styles.colOverview}>
              <div className={styles.overviewCard} style={{ borderColor: T.border }}>
                <div className={styles.overviewHero}>
                  <div className={styles.overviewAvatar}>{member?.initials ?? '?'}</div>
                  <div className={styles.overviewInfo}>
                    <div className={styles.overviewName}>{member?.name ?? 'Unknown Member'}</div>
                    <div className={styles.overviewTags}>
                      <span className={styles.overviewTagId}>#{enrollment.number}</span>
                    </div>
                  </div>
                </div>
                <div
                  className={styles.enrollDetails}
                  style={{ borderTop: `1px solid ${T.border}` }}
                >
                  {(
                    [
                      ['Enrollment Date', formatDate(enrollment.enrollmentDate)],
                      ['Effective Date', formatDate(enrollment.effectiveDate)],
                      ['Group', enrollment.group || '—'],
                      ['Address', enrollment.address ?? '—'],
                      ['Age', member?.age ?? '—'],
                      ['Employer / Group', member?.employerGroup ?? '—'],
                      ['Phone', member?.phone ?? '—'],
                      ['Email', member?.email ?? '—'],
                      ['Representative', representative?.name ?? '—'],
                      ['Rep. Email', representative?.email ?? '—'],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className={styles.enrollRow} style={{ borderColor: T.border }}>
                      <span style={{ color: T.textMuted }}>{label}</span>
                      <strong
                        style={{
                          color: T.text,
                          textAlign: 'right',
                          maxWidth: '56%',
                          wordBreak: 'break-all',
                        }}
                      >
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPlanSelectionPage;
