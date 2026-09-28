import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi';
import { useTheme } from '@/app/providers/ThemeContext';
import corenrollogoSvg from '@/assets/image/corenrollogo.svg';
import { useValidateAccess } from '@/domains/member-questions/hooks/useValidateAccess';
import { ROUTES } from '@/app/router/routeConfig';
import styles from '@/domains/otp/pages/OtpPage.module.css';

export function MemberAccessPage() {
  const { T } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { data, isLoading, isError } = useValidateAccess(token);
  const actionTakenRef = useRef(false);

  // Both "accept" and "decline" links must be verified via OTP before the
  // member can act — decline no longer short-circuits straight to the
  // confirmation UI, it goes through /member-portal/otp exactly like accept.
  useEffect(() => {
    if (!data?.valid || actionTakenRef.current) return;
    if (data.completed) return; // stay on page — rendered as "already submitted" below
    actionTakenRef.current = true;

    sessionStorage.setItem('portal_link_token', token);
    sessionStorage.setItem('portal_email', data.email);
    if (data.action === 'accept' || data.action === 'decline') {
      sessionStorage.setItem('portal_action', data.action);
      sessionStorage.setItem('portal_enrollment_id', data.enrollmentId ?? '');
    } else {
      sessionStorage.removeItem('portal_action');
      sessionStorage.removeItem('portal_enrollment_id');
    }
    navigate(ROUTES.MEMBER_PORTAL_OTP, {
      replace: true,
      state: { token, email: data.email },
    });
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Already submitted ────────────────────────────────────────────────────────
  if (data?.completed) {
    const isDecline = data.action === 'decline';
    return (
      <div className={styles.page} style={{ background: T.bg }}>
        {header}
        <div className={styles.body}>
          <div
            className={styles.card}
            style={{ background: T.bgCard, borderColor: T.border, textAlign: 'center' }}
          >
            <div
              className={styles.iconRing}
              style={{
                background: isDecline ? T.redDim : T.greenDim,
                color: isDecline ? T.red : T.green,
              }}
            >
              {isDecline ? <HiOutlineXCircle size={32} /> : <HiOutlineCheckCircle size={32} />}
            </div>
            <h1 className={styles.title} style={{ color: T.text }}>
              {isDecline ? 'Already Declined' : 'Already Submitted'}
            </h1>
            <p className={styles.subtitle} style={{ color: T.textMuted }}>
              {isDecline
                ? 'This enrollment has already been declined. If you have any questions or would like to reconsider, please contact your representative.'
                : 'Your responses have already been submitted. Our underwriting team will be in touch once the review is complete.'}
            </p>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // ── Invalid / expired link ───────────────────────────────────────────────────
  if (isError || !token) {
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
              Link Expired or Invalid
            </h1>
            <p className={styles.subtitle} style={{ color: T.textMuted }}>
              This link has expired or is no longer valid. Please contact your underwriter to
              request a new link.
            </p>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // ── Loading / validating ─────────────────────────────────────────────────────
  return (
    <div className={styles.page} style={{ background: T.bg }}>
      {header}
      <div className={styles.body}>
        <div className={styles.card} style={{ background: T.bgCard, borderColor: T.border }}>
          <div className={styles.iconRing} style={{ background: T.indigoDim, color: T.indigo }}>
            <HiOutlineShieldCheck size={32} />
          </div>
          <h1 className={styles.title} style={{ color: T.text }}>
            Validating Your Link
          </h1>
          <p className={styles.subtitle} style={{ color: T.textMuted }}>
            Please wait while we verify your access link…
          </p>
          {isLoading && (
            <span
              className={styles.spinner}
              style={{ borderColor: T.indigoDim, borderTopColor: T.indigo }}
            />
          )}
        </div>
      </div>
      {footer}
    </div>
  );
}
