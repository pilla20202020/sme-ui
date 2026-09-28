import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineExclamationCircle, HiOutlineXCircle } from 'react-icons/hi';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '@/app/providers/ThemeContext';
import corenrollogoSvg from '@/assets/image/corenrollogo.svg';
import { useDeclineDetails } from '@/domains/member-questions/hooks/useDeclineDetails';
import { declineApi, DeclineApiError } from '@/domains/member-questions/api/memberQuestionsApi';
import { ReasonDropdown } from '@/domains/member-questions/components/ReasonDropdown';
import { ROUTES } from '@/app/router/routeConfig';
import styles from '@/domains/otp/pages/OtpPage.module.css';

function clearPortalSession() {
  sessionStorage.removeItem('portal_link_token');
  sessionStorage.removeItem('portal_email');
  sessionStorage.removeItem('portal_action');
  sessionStorage.removeItem('portal_enrollment_id');
  sessionStorage.removeItem('portal_access_token');
}

export function DeclinePage() {
  const { T } = useTheme();
  const navigate = useNavigate();

  // Reached only after OTP verification set these — deep-linking here directly
  // (without going through /member-portal/access → /member-portal/otp first)
  // must not grant access to the decline form. Identity for the decline-details
  // and decline calls comes entirely from this OTP-issued accessToken
  // (30-min validity), not the raw link token.
  const accessToken = sessionStorage.getItem('portal_access_token') ?? '';
  const hasOtpSession = sessionStorage.getItem('portal_action') === 'decline' && !!accessToken;

  const { data, isLoading, error } = useDeclineDetails(hasOtpSession ? accessToken : '');
  const [reason, setReason] = useState('');

  const declineMutation = useMutation({
    mutationFn: () => declineApi(accessToken, reason),
    onSuccess: () => clearPortalSession(),
  });

  useEffect(() => {
    if (!hasOtpSession) {
      navigate(ROUTES.MEMBER_PORTAL_ACCESS, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasOtpSession && !declineMutation.isSuccess) return null;

  const header = (
    <div className={styles.header} style={{ background: T.bgCard, borderColor: T.border }}>
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <img src={corenrollogoSvg} alt="CoreEnroll" className={styles.logo} />
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className={styles.footer} style={{ borderColor: T.border, color: T.textMuted }}>
      &copy; 2026 CoreEnroll &mdash; Secure &amp; Encrypted
    </div>
  );

  // ── Declined successfully ────────────────────────────────────────────────────
  if (declineMutation.isSuccess) {
    return (
      <div className={styles.page} style={{ background: T.bg }}>
        {header}
        <div className={styles.body}>
          <div
            className={styles.card}
            style={{ background: T.bgCard, borderColor: T.border, textAlign: 'center' }}
          >
            <div className={styles.iconRing} style={{ background: T.redDim, color: T.red }}>
              <HiOutlineXCircle size={32} />
            </div>
            <h1 className={styles.title} style={{ color: T.text }}>
              Enrollment Declined
            </h1>
            <p className={styles.subtitle} style={{ color: T.textMuted }}>
              Your enrollment has been declined. If you have any questions or would like to
              reconsider, please contact your representative.
            </p>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // ── Enrollment not found (404) ───────────────────────────────────────────────
  if (error instanceof DeclineApiError && error.status === 404) {
    return (
      <div className={styles.page} style={{ background: T.bg }}>
        {header}
        <div className={styles.body}>
          <div
            className={styles.card}
            style={{ background: T.bgCard, borderColor: T.border, textAlign: 'center' }}
          >
            <div className={styles.iconRing} style={{ background: T.redDim, color: T.red }}>
              <HiOutlineExclamationCircle size={32} />
            </div>
            <h1 className={styles.title} style={{ color: T.text }}>
              Enrollment Not Found
            </h1>
            <p className={styles.subtitle} style={{ color: T.textMuted }}>
              We couldn&apos;t find your enrollment. Please contact your representative.
            </p>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // ── Session expired (401) — the 30-min accessToken from OTP has lapsed ──────
  if (error) {
    return (
      <div className={styles.page} style={{ background: T.bg }}>
        {header}
        <div className={styles.body}>
          <div
            className={styles.card}
            style={{ background: T.bgCard, borderColor: T.border, textAlign: 'center' }}
          >
            <div className={styles.iconRing} style={{ background: T.redDim, color: T.red }}>
              <HiOutlineExclamationCircle size={32} />
            </div>
            <h1 className={styles.title} style={{ color: T.text }}>
              Session Expired
            </h1>
            <p className={styles.subtitle} style={{ color: T.textMuted }}>
              Your verification session has expired. Please reopen the link from your email to
              verify again.
            </p>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // ── Loading / validating ─────────────────────────────────────────────────────
  if (isLoading || !data) {
    return (
      <div className={styles.page} style={{ background: T.bg }}>
        {header}
        <div className={styles.body}>
          <div className={styles.card} style={{ background: T.bgCard, borderColor: T.border }}>
            <div className={styles.iconRing} style={{ background: T.indigoDim, color: T.indigo }}>
              <HiOutlineShieldCheck size={32} />
            </div>
            <h1 className={styles.title} style={{ color: T.text }}>
              Loading Your Details
            </h1>
            <p className={styles.subtitle} style={{ color: T.textMuted }}>
              Please wait while we load your enrollment details…
            </p>
            <span
              className={styles.spinner}
              style={{ borderColor: T.indigoDim, borderTopColor: T.indigo }}
            />
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // ── Confirm decline (member name, plan, reason) ──────────────────────────────
  return (
    <div className={styles.page} style={{ background: T.bg }}>
      {header}
      <div className={styles.body}>
        <div
          className={styles.card}
          style={{ background: T.bgCard, borderColor: T.border, maxWidth: '650px' }}
        >
          <div className={styles.iconRing} style={{ background: T.redDim, color: T.red }}>
            <HiOutlineXCircle size={32} />
          </div>
          <h1 className={styles.title} style={{ color: T.text }}>
            Confirm Enrollment Rejection
          </h1>
          <p className={styles.subtitle} style={{ color: T.textMuted }}>
            Please review the details below before rejecting this enrollment.
          </p>

          <div className={styles.declineInfo} style={{ borderColor: T.border }}>
            <div className={styles.declineInfoRow} style={{ borderColor: T.border }}>
              <span style={{ color: T.textMuted }}>Member Name</span>
              <strong style={{ color: T.text }}>{data.memberName}</strong>
            </div>
            <div className={styles.declineInfoRow} style={{ borderColor: T.border }}>
              <span style={{ color: T.textMuted }}>Plan</span>
              <strong style={{ color: T.text }}>{data.planName}</strong>
            </div>
          </div>

          <div className={styles.declineReasonField}>
            <label
              className={styles.declineReasonLabel}
              style={{ color: T.text }}
              htmlFor="decline-reason"
            >
              Reason for Rejection <span style={{ color: T.red }}>*</span>
            </label>
            <ReasonDropdown
              id="decline-reason"
              options={data.declineReasons}
              value={reason}
              onChange={setReason}
            />
          </div>

          {declineMutation.isError && (
            <p className={styles.error} style={{ background: T.redDim, color: T.red }}>
              {declineMutation.error instanceof DeclineApiError
                ? declineMutation.error.message
                : 'We could not process your reject request. Please try again.'}
            </p>
          )}

          <button
            className={styles.verifyBtn}
            style={{ background: T.red, color: '#fff' }}
            onClick={() => declineMutation.mutate()}
            disabled={!reason || declineMutation.isPending}
          >
            {declineMutation.isPending && (
              <span
                className={styles.spinner}
                style={{ borderColor: 'rgba(255,255,255,0.35)', borderTopColor: '#fff' }}
              />
            )}
            {declineMutation.isPending ? 'Rejecting...' : 'Reject Enrollment'}
          </button>
        </div>
      </div>
      {footer}
    </div>
  );
}

export default DeclinePage;
