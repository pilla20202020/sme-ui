import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineArrowRight, HiOutlineRefresh } from 'react-icons/hi';
import { useTheme } from '@/app/providers/ThemeContext';
import corenrollogoSvg from '@/assets/image/corenrollogo.svg';
import styles from './OtpPage.module.css';
import { ROUTES } from '@/app/router/routeConfig';
import { useSendOtp } from '@/domains/member-questions/hooks/useSendOtp';
import { useVerifyOtp } from '@/domains/member-questions/hooks/useVerifyOtp';

const OTP_LENGTH = 6;

interface OtpLocationState {
  token?: string;
  email?: string;
}

export function OtpPage() {
  const { T } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = (location.state ?? {}) as OtpLocationState;

  // Member portal Q&A flow: token is passed via router state from MemberAccessPage
  const portalToken = locationState.token ?? sessionStorage.getItem('portal_link_token') ?? '';
  const portalEmail = locationState.email ?? sessionStorage.getItem('portal_email') ?? '';
  const isMemberPortalFlow = !!portalToken;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpSentRef = useRef(false);

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  // Send OTP automatically on mount for the member portal flow
  useEffect(() => {
    if (isMemberPortalFlow && !otpSentRef.current) {
      otpSentRef.current = true;
      sendOtpMutation.mutate(portalToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filled = digits.every((d) => d !== '');
  const otp = digits.join('');

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError('');
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleVerify() {
    if (!filled || verifying || verifyOtpMutation.isPending) return;

    if (isMemberPortalFlow) {
      verifyOtpMutation.mutate(
        { token: portalToken, otp },
        {
          onSuccess: (data) => {
            sessionStorage.setItem('portal_access_token', data.accessToken);
            const action = sessionStorage.getItem('portal_action');
            if (action === 'accept') {
              navigate(ROUTES.MEMBER_PORTAL_PLAN_SELECTION);
            } else if (action === 'decline') {
              navigate(ROUTES.MEMBER_PORTAL_DECLINE);
            } else {
              navigate(ROUTES.MEMBER_PORTAL);
            }
          },
          onError: () => {
            setError('Incorrect code or the code has expired. Please request a new one.');
            setDigits(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
          },
        }
      );
    } else {
      // Plan-selection flow — forward the ?id= param from the current URL
      const id = searchParams.get('id');
      setVerifying(true);
      setTimeout(() => {
        setVerifying(false);
        navigate(id ? `${ROUTES.PLAN_SELECTION}?id=${id}` : ROUTES.PLAN_SELECTION);
      }, 900);
    }
  }

  function handleResend() {
    setDigits(Array(OTP_LENGTH).fill(''));
    setError('');
    setResent(true);
    inputRefs.current[0]?.focus();
    if (isMemberPortalFlow) {
      sendOtpMutation.mutate(portalToken, {
        onSettled: () => setTimeout(() => setResent(false), 4000),
      });
    } else {
      setTimeout(() => setResent(false), 4000);
    }
  }

  const isDisabled = !filled || verifying || verifyOtpMutation.isPending;

  function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  }

  return (
    <div className={styles.page} style={{ background: T.bg }}>
      {/* Header */}
      <div className={styles.header} style={{ background: T.bgCard, borderColor: T.border }}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <img src={corenrollogoSvg} alt="CoreEnroll" className={styles.logo} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.card} style={{ background: T.bgCard, borderColor: T.border }}>
          <div className={styles.iconRing} style={{ background: T.indigoDim, color: T.indigo }}>
            <HiOutlineShieldCheck size={32} />
          </div>

          <h1 className={styles.title} style={{ color: T.text }}>
            Verify Your Identity
          </h1>
          <p className={styles.subtitle} style={{ color: T.textMuted }}>
            We sent a 6-digit verification code to your registered email&nbsp;
            <strong style={{ color: T.text }}>
              {isMemberPortalFlow ? maskEmail(portalEmail) : 'j***@email.com'}
            </strong>
            . Enter it below to continue.
          </p>

          {/* OTP inputs */}
          <div className={styles.otpRow} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                className={styles.otpInput}
                style={{
                  background: T.bgAlt,
                  borderColor: error ? T.red : d ? T.indigo : T.border,
                  color: T.text,
                  boxShadow: d ? `0 0 0 3px ${T.indigoDim}` : 'none',
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <div className={styles.error} style={{ color: T.red, background: T.redDim }}>
              {error}
            </div>
          )}
          {resent && (
            <div className={styles.resentMsg} style={{ color: T.indigo, background: T.indigoDim }}>
              A new code has been sent to your email.
            </div>
          )}

          {/* Verify button — primary always, opacity when disabled */}
          <button
            className={styles.verifyBtn}
            style={{
              background: T.indigo,
              color: '#ffffff',
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
            onClick={handleVerify}
            disabled={isDisabled}
          >
            {verifying ? (
              <span className={styles.spinner} />
            ) : (
              <>
                Verify &amp; Continue <HiOutlineArrowRight size={15} />
              </>
            )}
          </button>

          <button className={styles.resendBtn} style={{ color: T.indigo }} onClick={handleResend}>
            <HiOutlineRefresh size={14} /> Resend Code
          </button>
        </div>
      </div>

      <div className={styles.footer} style={{ borderColor: T.border, color: T.textMuted }}>
        &copy; 2026 CoreEnroll &mdash; Secure &amp; Encrypted
      </div>
    </div>
  );
}

export default OtpPage;
