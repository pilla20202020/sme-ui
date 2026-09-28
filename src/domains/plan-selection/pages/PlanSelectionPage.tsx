import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useTheme } from '@/app/providers/ThemeContext';
import corenrollogoSvg from '@/assets/image/corenrollogo.svg';
import { usePlanSelectionQuery } from '../data/use-plan-selection.query';
import { useSubmitPlanSelectionMutation } from '../data/use-submit-plan-selection.mutation';
import { SignatureCanvas, type SignatureCanvasHandle } from '../components/SignatureCanvas';
import { PlanSelectionSkeleton } from '../components/PlanSelectionSkeleton';
import styles from './PlanSelectionPage.module.css';
import { formatDate } from '@/shared/utils';
import { ROUTES } from '@/app/router/routeConfig';

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

const TERMS_TEXT = [
  {
    title: 'Binding Arbitration & Jurisdiction',
    body: 'The Parties agree that any dispute between them arising out of, based upon or relating to this Agreement shall be resolved exclusively by arbitration conducted in accordance with the Commercial Rules then in effect of the American Arbitration Association. Such arbitration shall be held in or around Roswell, Georgia. Judgment upon the award rendered shall be final and non-appealable and may be entered in any court having jurisdiction. Each Party shall bear its own expenses arising out of any such proceeding, except that the fees and costs of any arbitrator(s) shall be borne equally by the Parties. The laws of Georgia shall govern this Agreement and its interpretation.',
  },
  {
    title: 'Conditions of Participation',
    body: `Member further agrees that: For coverage to go into effect, the Member's Request/Contract must be accepted by the Plan. For coverage by the Plan to remain in force, the Member must: (1) be an eligible member of HC Data Consulting, LLC on or before their Effective Date; (2) meet membership requirements established by the governing documents of HC Data Consulting, LLC; (3) remain a member in good standing of HC Data Consulting, LLC. The Member has seen the copy of the benefits proposed and agrees to remit all applicable healthcare fees to the Plan as outlined in Section Three (3). At all times, the coverage is subject to the benefit plan applied for by the Member, which alone constitutes the Contract under which benefits become payable. Member understands and agrees that the Plan may not renew health coverage, which determination is left to the sole discretion of the Plan. Acceptance of this Request/Contract by the Plan is subject to the Member's willingness to be bound by the Plan's requirements.`,
  },
];

export function PlanSelectionPage() {
  const { T } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const enrollmentId = Number(searchParams.get('id')) || null;
  const portalToken = sessionStorage.getItem('portal_access_token') || null;

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = usePlanSelectionQuery(portalToken ? null : enrollmentId, portalToken);
  console.log(queryError);

  const loadError: 'invalid_token' | 'token_expired' | 'error' | null =
    queryError?.message === 'token_expired'
      ? 'token_expired'
      : queryError?.message === 'invalid_token'
        ? 'invalid_token'
        : queryError
          ? 'error'
          : null;

  const plans = useMemo(() => {
    const seen = new Set<string>();
    return [...(data?.availablePlans ?? []), data?.selectedPlan]
      .filter((p): p is NonNullable<typeof p> => p != null)
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
  }, [data]);
  const currentPlanId = data?.currentPlanId ?? '';

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
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
      setSelectedPlanId(currentPlanId);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId]
  );
  const previousPlan = useMemo(
    () => plans.find((p) => p.id === currentPlanId) ?? plans[0],
    [plans, currentPlanId]
  );
  const isPreviousPlanSelected = selectedPlan?.id === previousPlan?.id;

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

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { mutate: submitSelection, isPending: submitting } =
    useSubmitPlanSelectionMutation(portalToken);

  const canContinue = Boolean(
    !submitting && selectedPlan && effectiveDate && hasDrawn && termsAgreed
  );

  function handleContinue() {
    if (!canContinue || !data || !selectedPlan) return;
    const imageData = sigRef.current?.getImageData() ?? undefined;

    setSubmitError(null);

    const isSwitchingPlan = selectedPlan.id !== data.currentPlanId;
    const newPlanPricingId = selectedPlan.planPricings?.[0]?.planPricingId;

    submitSelection(
      portalToken
        ? { selectedPlanId: selectedPlan.id, effectiveDate, signatureData: imageData }
        : {
            policyId: data.policyId,
            selectedPlanId: selectedPlan.id,
            effectiveDate,
            signatureData: imageData,
            ...(isSwitchingPlan && data.currentPlanPricingId != null && newPlanPricingId != null
              ? {
                  currentPlanId: data.currentPlanPricingId,
                  planId: newPlanPricingId,
                  planPricingId: newPlanPricingId,
                }
              : {}),
          },
      {
        onSuccess: () => {
          const isPortalFlow = !!sessionStorage.getItem('portal_action');
          if (isPortalFlow) {
            sessionStorage.removeItem('portal_action');
            sessionStorage.removeItem('portal_enrollment_id');
            sessionStorage.removeItem('portal_access_token');
            setSubmitted(true);
          } else {
            toast.success('Plan selection submitted successfully.');
            navigate(ROUTES.ENROLLMENTS, { state: { filterStatus: 'Ready to Activate' } });
          }
        },
        onError: (err) => setSubmitError(err instanceof Error ? err.message : 'Submission failed'),
      }
    );
  }

  if (submitted) {
    return (
      <div className={styles.page} style={{ background: T.bg }}>
        <div className={styles.header} style={{ background: T.bgCard, borderColor: T.border }}>
          <div className={styles.headerInner}>
            <div className={styles.brand}>
              <img src={corenrollogoSvg} alt="CoreEnroll" className={styles.logo} />
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <HiOutlineCheckCircle
              size={56}
              style={{ color: T.indigo, margin: 'auto', marginBottom: 20 }}
            />
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 12 }}>
              Enrollment Accepted
            </div>
            <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.7 }}>
              Thank you! Your enrollment has been submitted and is now pending activation. Your
              representative will be in touch with next steps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page} style={{ background: T.bg }}>
        <div className={styles.header} style={{ background: T.bgCard, borderColor: T.border }}>
          <div className={styles.headerInner}>
            <div className={styles.brand}>
              <img src={corenrollogoSvg} alt="CoreEnroll" className={styles.logo} />
            </div>
          </div>
        </div>
        <div className={styles.scrollArea}>
          <div className={styles.main}>
            <PlanSelectionSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    const message =
      loadError === 'token_expired'
        ? 'This link has expired. Please contact your representative for a new link.'
        : 'This link is invalid or has already been used. Please contact your representative.';
    return (
      <div className={styles.page} style={{ background: T.bg }}>
        <div className={styles.header} style={{ background: T.bgCard, borderColor: T.border }}>
          <div className={styles.headerInner}>
            <div className={styles.brand}>
              <img src={corenrollogoSvg} alt="CoreEnroll" className={styles.logo} />
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            padding: 32,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 8 }}>
              {loadError === 'token_expired' ? 'Link Expired' : 'Invalid Link'}
            </div>
            <p style={{ color: T.textMuted, fontSize: 14 }}>{message}</p>
          </div>
        </div>
      </div>
    );
  }

  const { member, enrollment, representative } = data;

  return (
    <div className={styles.page} style={{ background: T.bg }}>
      <div className={styles.header} style={{ background: T.bgCard, borderColor: T.border }}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <img src={corenrollogoSvg} alt="CoreEnroll" className={styles.logo} />
          </div>
        </div>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.main}>
          <div className={styles.heroCard}>
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
                      {isPreviousPlanSelected ? 'Current Plan Kept' : 'Selected Plan'}
                    </div>
                    <div className={styles.selectedPlanName} style={{ color: T.text }}>
                      {selectedPlan ? planDisplayName(selectedPlan) : 'No plan selected'}
                    </div>
                    <div className={styles.selectedPlanMeta} style={{ color: T.textMuted }}>
                      {selectedPlan
                        ? `$${planPrice(selectedPlan).toFixed(2)} / month`
                        : 'Choose a plan below'}
                    </div>
                  </div>
                  <div
                    className={styles.selectedPlanBadge}
                    style={{ background: T.indigoDim, color: T.indigo }}
                  >
                    {isPreviousPlanSelected ? 'Previous Plan' : 'New Choice'}
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
                <div
                  className={styles.previousPlanPrompt}
                  style={{ borderColor: T.border, background: T.bgAlt }}
                >
                  <div>
                    <div className={styles.previousPlanTitle} style={{ color: T.text }}>
                      Still want to keep your current plan?
                    </div>
                    <div className={styles.previousPlanBody} style={{ color: T.textMuted }}>
                      Your currently enrolled plan is{' '}
                      <strong style={{ color: T.text }}>{planDisplayName(previousPlan)}</strong>.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanId(previousPlan?.id ?? currentPlanId)}
                    className={styles.previousPlanBtn}
                    style={{
                      borderColor: isPreviousPlanSelected ? T.indigo : T.border,
                      background: isPreviousPlanSelected ? T.indigoDim : T.bgCard,
                      color: isPreviousPlanSelected ? T.indigo : T.text,
                    }}
                  >
                    {isPreviousPlanSelected ? '✓ Keeping Current Plan' : 'Keep Current Plan'}
                  </button>
                </div>
                <div className={styles.planListScroll}>
                  <div className={styles.planGrid}>
                    {plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      const isCurrent = plan.id === currentPlanId;
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
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel} style={{ color: T.text }}>
                    <HiOutlineCalendar size={14} /> Effective Date
                  </span>
                  <div
                    className={styles.fieldReadOnly}
                    style={{
                      color: T.text,
                      background: T.bgAlt,
                      borderColor: T.border,
                    }}
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
                  <span className="text-xs">*Excluding association fees</span>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div
                className={styles.sectionCard}
                style={{ borderColor: T.border, background: T.bgCard }}
              >
                <div className={styles.sectionLabel} style={{ color: T.text }}>
                  <HiOutlineDocumentText size={15} />
                  Terms &amp; Conditions
                </div>
                <div className={styles.termsText}>
                  {TERMS_TEXT.map((section) => (
                    <div key={section.title} className={styles.termsSection}>
                      <div className={styles.termsSectionTitle} style={{ color: T.text }}>
                        {section.title}
                      </div>
                      <p className={styles.termsBody} style={{ color: T.textMuted }}>
                        {section.body}
                      </p>
                    </div>
                  ))}
                </div>
                <label
                  className={styles.termsAgree}
                  style={{
                    borderColor: termsAgreed ? T.indigo : T.border,
                    background: termsAgreed ? T.indigoDim : T.bgAlt,
                  }}
                >
                  <input
                    type="checkbox"
                    className={styles.termsCheckbox}
                    style={{ '--cb-color': T.indigo } as React.CSSProperties}
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                  />
                  <span style={{ color: termsAgreed ? T.indigo : T.text }}>
                    I agree to the terms and conditions
                  </span>
                </label>
              </div>

              <SignatureCanvas ref={sigRef} onDrawChange={setHasDrawn} />

              <div className={styles.footerInner}>
                {submitError && (
                  <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{submitError}</p>
                )}
                <button
                  type="button"
                  className={styles.continueBtn}
                  onClick={handleContinue}
                  disabled={!canContinue}
                  style={{ background: T.indigo }}
                >
                  {submitting ? 'Submitting…' : 'Submit'} <HiOutlineArrowRight size={15} />
                </button>
              </div>
            </section>

            <aside className={styles.colOverview}>
              {/* Member + Enrollment Summary */}
              <div className={styles.overviewCard} style={{ borderColor: T.border }}>
                <div className={styles.overviewHero}>
                  <div className={styles.overviewAvatar}>{member?.initials}</div>
                  <div className={styles.overviewInfo}>
                    <div className={styles.overviewName}>{member?.name}</div>
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
                      ['Group', enrollment.group],
                      ['Address', enrollment.address ?? '—'],
                      ['Age', member?.age ?? '—'],
                      ['Employer / Group', member?.employerGroup],
                      ['Phone', member?.phone ?? '—'],
                      ['Email', member?.email],
                      ['Representative', representative?.name],
                      ['Rep. Email', representative?.email],
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

export default PlanSelectionPage;
