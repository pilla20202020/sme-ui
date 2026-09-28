import { useState, useEffect } from 'react';
import { StatusBadge } from '@/shared/components/ui';
import {
  HiOutlineX,
  HiOutlineChatAlt2,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from 'react-icons/hi';
import type { Enrollment } from '@/domains/enrollments/types';
import {
  useQuestionLog,
  groupIntoQaThreads,
} from '@/domains/member-questions/hooks/useQuestionLog';
import { Spinner } from '@/shared/components/ui/Spinner';
import styles from './AskQuestionModal.module.css';

interface AskQuestionModalProps {
  enrollment: Enrollment;
  onClose: () => void;
  onSend: (enrollment: Enrollment, questions: string[]) => void;
  isPending?: boolean;
}

export function AskQuestionModal({
  enrollment,
  onClose,
  onSend,
  isPending = false,
}: AskQuestionModalProps) {
  const [questions, setQuestions] = useState<string[]>(['']);
  const [activeTab, setActiveTab] = useState<'previous' | 'new'>('previous');

  const { data: logItems = [] } = useQuestionLog(enrollment.policyId);
  const threads = groupIntoQaThreads(logItems);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function updateQ(i: number, v: string) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? v : q)));
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, '']);
  }

  function removeQuestion(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  function handleSend() {
    const filled = questions.filter((q) => q.trim());
    if (!filled.length) return;
    onSend(enrollment, filled);
  }

  const canSend = questions.some((q) => q.trim());

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <HiOutlineChatAlt2 />
            </div>
            <div>
              <div className={styles.headerTitle}>Ask Questions</div>
              <div className={styles.headerSubtitle}>Send underwriting questions to member</div>
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
              {/* <div className={styles.memberGrid}>
                {memberFields.map(({ icon, label, sub }) => (
                  <div key={sub} className={styles.memberField}>
                    <span className={styles.memberFieldIcon}>{icon}</span>
                    <div>
                      <div className={styles.memberFieldLabel}>{label}</div>
                      <div className={styles.memberFieldSub}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div> */}
            </div>
          </div>

          {/* Tabs */}
          {threads.length > 0 && (
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'previous' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('previous')}
              >
                Previous Questions
                <span className={styles.historyCount}>{logItems.length}</span>
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'new' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('new')}
              >
                New Question
              </button>
            </div>
          )}

          {/* Q&A History */}
          {threads.length > 0 && activeTab === 'previous' && (
            <div className={styles.historySection}>
              {[...threads].reverse().map((thread) => (
                <div key={thread.round} className={styles.threadCard}>
                  <div className={styles.threadHeader}>
                    <div className={styles.threadHeaderLeft}>
                      <span className={styles.threadAuthor}>
                        {thread.askedBy || 'Underwriting Team'}
                      </span>
                      <span className={styles.sentDate}>· {thread.dateSent}</span>
                    </div>
                    {thread.answers !== null ? (
                      <span className={styles.answeredBadge}>
                        <HiOutlineCheckCircle /> Answered
                      </span>
                    ) : (
                      <span className={styles.awaitingBadge}>
                        <HiOutlineClock /> Awaiting
                      </span>
                    )}
                  </div>
                  <div className={styles.qaList}>
                    {thread.questions.map((q, i) => (
                      <div key={i} className={styles.qaPair}>
                        <div className={styles.qaQuestion}>
                          <span className={styles.qaLabel}>Q{i + 1}</span>
                          <span className={styles.qaText}>{q}</span>
                        </div>
                        {thread.answers !== null && (
                          <div className={styles.qaAnswer}>
                            <span className={styles.qaAnswerLabel}>A</span>
                            <span className={styles.qaText}>{thread.answers[i] ?? '—'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Questions */}
          {(threads.length === 0 || activeTab === 'new') && (
            <div>
              {threads.length === 0 && <div className={styles.sectionLabel}>Questions</div>}
              {questions.map((q, i) => (
                <div key={i} className={styles.questionCard}>
                  <div className={styles.questionCardHeader}>
                    <span className={styles.questionLabel}>Q{i + 1}</span>
                    {questions.length > 1 && (
                      <button className={styles.removeBtn} onClick={() => removeQuestion(i)}>
                        <HiOutlineTrash />
                        Remove
                      </button>
                    )}
                  </div>
                  <textarea
                    className={styles.textarea}
                    value={q}
                    onChange={(e) => updateQ(i, e.target.value)}
                    rows={3}
                    placeholder="Enter your question..."
                  />
                </div>
              ))}
              <button className={styles.addBtn} onClick={addQuestion}>
                <HiOutlinePlus />
                Add Another Question
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button className={styles.sendBtn} onClick={handleSend} disabled={!canSend || isPending}>
            {isPending && (
              <Spinner size="xs" color="#ffffff" trackColor="rgba(255,255,255,0.35)" decorative />
            )}
            {isPending ? 'Sending…' : 'Send Questions'}
          </button>
        </div>
      </div>
    </>
  );
}
