import { useState } from 'react';
import type React from 'react';
import {
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineUser,
  // HiOutlineCalendar,
  HiOutlineX,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { useTheme } from '@/app/providers/ThemeContext';
import corenrollogoSvg from '@/assets/image/corenrollogo.svg';
import styles from './MemberPortalPage.module.css';
import { usePendingQuestions } from '@/domains/member-questions/hooks/usePendingQuestions';
import { useSubmitAnswers } from '@/domains/member-questions/hooks/useSubmitAnswers';
import { Spinner } from '@/shared/components/ui/Spinner';
import toast from 'react-hot-toast';

export function MemberPortalPage() {
  const { T } = useTheme();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [responseDone, setResponseDone] = useState(false);

  const accessToken = sessionStorage.getItem('portal_access_token');
  const portalEmail = sessionStorage.getItem('portal_email') ?? '';

  const { data: pendingData, isLoading, isError } = usePendingQuestions(accessToken);
  const submitAnswersMutation = useSubmitAnswers();

  const questions = pendingData?.questions ?? [];
  const member = pendingData?.member;
  const memberName = member?.memberName ?? (portalEmail ? portalEmail.split('@')[0] : 'Member');
  const initials = memberName.slice(0, 2).toUpperCase();

  const answeredCount = questions.filter((q) => (answers[q.id] ?? '').trim().length > 0).length;
  const canSubmit = questions.length > 0 && answeredCount === questions.length && !responseDone;

  function dismissModal() {
    setSubmitted(false);
    setResponseDone(true);
    sessionStorage.removeItem('portal_access_token');
    sessionStorage.removeItem('portal_link_token');
    sessionStorage.removeItem('portal_email');
  }

  function setAnswer(id: string, val: string) {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }

  function handleSubmit() {
    if (!canSubmit || !accessToken) return;
    const payload = questions.map((q) => ({
      questionId: Number(q.id),
      answer: answers[q.id] ?? '',
    }));
    submitAnswersMutation.mutate(
      { accessToken, answers: payload },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => toast.error('Failed to submit answers. Please try again.'),
      }
    );
  }

  // Session missing or expired
  if (!accessToken) {
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
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          <div style={{ textAlign: 'center', color: T.textMuted }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <HiOutlineExclamationCircle size={40} style={{ color: T.red, marginBottom: 12 }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              Session Expired
            </div>
            <div style={{ fontSize: 14 }}>
              Your session has expired. Please use the original email link to start again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Questions already answered — no pending questions returned
  if (!isLoading && !isError && questions.length === 0) {
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
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          <div style={{ textAlign: 'center', color: T.textMuted }}>
            <div className="" style={{ display: 'flex', justifyContent: 'center' }}>
              <HiOutlineCheckCircle size={40} style={{ color: T.green, marginBottom: 12 }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              Already Submitted
            </div>
            <div style={{ fontSize: 14 }}>
              Your responses have already been submitted. Our underwriting team will be in touch
              once the review is complete.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} style={{ background: T.bg }}>
      {/* ── Header ── */}
      <div className={styles.header} style={{ background: T.bgCard, borderColor: T.border }}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <img src={corenrollogoSvg} alt="CoreEnroll" className={styles.logo} />
          </div>
        </div>
      </div>

      {/* ── Scroll Area ── */}
      <div className={styles.scrollArea}>
        <div className={styles.main}>
          <div className={styles.twoCol}>
            {/* ── Left: Questions ── */}
            <div className={styles.colQuestions}>
              <div className={styles.sectionLabel} style={{ color: T.text }}>
                <HiOutlineClipboardList size={14} />
                Questions &amp; Answers
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 600,
                    color:
                      answeredCount === questions.length && questions.length > 0
                        ? T.green
                        : T.amber,
                  }}
                >
                  {answeredCount} / {questions.length} answered
                </span>
              </div>

              {isLoading &&
                Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className={styles.qaCard}
                    style={{ borderColor: T.border, background: T.bgCard }}
                  >
                    <div
                      className={styles.qaCardHeader}
                      style={{ background: T.bgAlt, borderColor: T.border }}
                    >
                      <div
                        className={styles.qNum}
                        style={{ background: T.indigoDim, color: T.indigo }}
                      >
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={styles.skeletonBar} style={{ width: '70%' }} />
                      </div>
                    </div>
                    <div className={styles.qaCardBody}>
                      <div className={styles.skeletonBar} style={{ width: '100%', height: 90 }} />
                    </div>
                  </div>
                ))}

              {isError && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 10,
                    background: T.redDim,
                    color: T.red,
                    fontSize: 13,
                  }}
                >
                  Your session has expired. Please use the original email link to start again.
                </div>
              )}

              {questions.map((q, i) => {
                const val = answers[q.id] ?? '';
                const answered = val.trim().length > 0;
                return (
                  <div
                    key={q.id}
                    className={styles.qaCard}
                    style={{ borderColor: T.border, background: T.bgCard }}
                  >
                    <div
                      className={styles.qaCardHeader}
                      style={{ background: T.bgAlt, borderColor: T.border }}
                    >
                      <div
                        className={styles.qNum}
                        style={{ background: T.indigoDim, color: T.indigo }}
                      >
                        {answered ? <HiOutlineCheckCircle size={13} /> : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={styles.qaQuestion} style={{ color: T.text }}>
                          {q.question}
                        </div>
                      </div>
                    </div>
                    <div className={styles.qaCardBody}>
                      <textarea
                        className={styles.qaTextarea}
                        style={{
                          background: T.bg,
                          border: '1px solid ' + (answered ? T.indigo : T.border),
                          color: T.text,
                          opacity: responseDone ? 0.6 : 1,
                        }}
                        placeholder="Type your response here..."
                        value={val}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        maxLength={1000}
                        disabled={responseDone}
                      />
                    </div>
                  </div>
                );
              })}

              <div className={styles.submitRow}>
                <button
                  className={styles.submitBtn}
                  style={{ background: T.indigo }}
                  disabled={!canSubmit || responseDone || submitAnswersMutation.isPending}
                  onClick={handleSubmit}
                >
                  {submitAnswersMutation.isPending ? (
                    <>
                      <Spinner
                        size="xs"
                        color="#ffffff"
                        trackColor="rgba(255,255,255,0.35)"
                        decorative
                      />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit Response <HiOutlineArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Right: Overview + Note ── */}
            <div className={styles.colOverview}>
              {/* Member Overview */}
              <div className={styles.overviewCard} style={{ borderColor: T.border }}>
                <div className={styles.overviewHero}>
                  <div className={styles.overviewAvatar}>{initials}</div>
                  <div className={styles.overviewInfo}>
                    <div className={styles.overviewName}>{memberName}</div>
                    <div className={styles.overviewTags}>
                      <span className={styles.overviewTagId}>{portalEmail}</span>
                    </div>
                  </div>
                </div>
                {/* Meta row */}
                <div
                  className={styles.overviewMeta}
                  style={{ background: T.bgAlt, borderTop: `1px solid ${T.border}` }}
                >
                  {(
                    [
                      {
                        icon: <HiOutlineDocumentText size={15} />,
                        label: 'Plan',
                        value: member?.plan ?? '—',
                        color: T.indigo,
                        dim: T.indigoDim,
                      },
                      {
                        icon: <HiOutlineUser size={15} />,
                        label: 'Requested By',
                        value: member?.requestedBy ?? '—',
                        color: T.purple,
                        dim: T.purpleDim,
                      },
                      // {
                      //   icon: <HiOutlineCalendar size={15} />,
                      //   label: 'Due Date',
                      //   value: '—',
                      //   color: T.amber,
                      //   dim: T.amberDim,
                      // },
                    ] as Array<{
                      icon: React.ReactNode;
                      label: string;
                      value: string;
                      color: string;
                      dim: string;
                    }>
                  ).map((item) => (
                    <div
                      key={item.label}
                      className={styles.overviewMetaItem}
                      style={{ borderColor: T.border }}
                    >
                      <div
                        className={styles.overviewMetaIcon}
                        style={{ background: item.dim, color: item.color }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <div className={styles.overviewMetaLabel}>{item.label}</div>
                        <div className={styles.overviewMetaValue} style={{ color: T.text }}>
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note Banner */}
              <div
                className={styles.noteBanner}
                style={{ background: T.amberLight, borderColor: T.amberDim }}
              >
                <div className={styles.noteIcon} style={{ background: T.amber, color: '#fff' }}>
                  <HiOutlineExclamation />
                </div>
                <div>
                  <div className={styles.noteTitle} style={{ color: T.text }}>
                    Additional Information Required
                  </div>
                  <div className={styles.noteBody} style={{ color: T.textMuted }}>
                    Our review team needs a few more details before your enrollment can continue.
                    Please answer all questions below and click{' '}
                    <strong style={{ color: T.text }}>Submit Response</strong> when complete.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* end scrollArea */}

      {/* ── Success Modal ── */}
      {submitted && (
        <div className={styles.modalBackdrop} onClick={dismissModal}>
          <div
            className={styles.modalCard}
            style={{ background: T.bgCard, borderColor: T.border, position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalCloseBtn}
              style={{ color: T.textMuted }}
              onClick={dismissModal}
              aria-label="Close"
            >
              <HiOutlineX size={18} />
            </button>
            <div className={styles.modalIcon} style={{ background: T.greenDim, color: T.green }}>
              <HiOutlineCheckCircle />
            </div>
            <div className={styles.modalTitle} style={{ color: T.text }}>
              Response Submitted!
            </div>
            <div className={styles.modalBody} style={{ color: T.textMuted }}>
              Your information has been securely sent to our underwriting team. You will be notified
              once the review is complete.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
