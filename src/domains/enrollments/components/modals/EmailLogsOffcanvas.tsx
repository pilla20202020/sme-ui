import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineX,
  HiOutlineMail,
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineReply,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineExclamationCircle,
  HiOutlinePaperAirplane,
  HiOutlineRefresh,
  HiOutlineInbox,
} from 'react-icons/hi';
import type { Enrollment } from '@/domains/enrollments/types';
import {
  useEmailLogsQuery,
  useEmailLogContentQuery,
  useForwardEmailMutation,
  useResendEmailMutation,
} from '@/domains/enrollments/hooks/useEmailLogsQuery';
import type {
  ApiEmailLog,
  EmailStatus,
  EmailLogsParams,
} from '@/domains/enrollments/api/emailLogsApi';
import { formatDateTime } from '@/shared/utils';
import { Spinner } from '@/shared/components/ui/Spinner';
import styles from './EmailLogsOffcanvas.module.css';

const PAGE_SIZE = 8;

type StatusFilter = 'All' | EmailStatus;

interface EmailLogsOffcanvasProps {
  enrollment: Enrollment;
  onClose: () => void;
}

const STATUS_CONFIG: Record<EmailStatus, { label: string; cls: string }> = {
  queued: { label: 'Queued', cls: styles.badgeSlate },
  pending: { label: 'Pending', cls: styles.badgeAmber },
  sent: { label: 'Sent', cls: styles.badgeGreen },
  delivered: { label: 'Delivered', cls: styles.badgeBlue },
  opened: { label: 'Opened', cls: styles.badgeTeal },
  bounced: { label: 'Bounced', cls: styles.badgeOrange },
  failed: { label: 'Failed', cls: styles.badgeRed },
  invalid: { label: 'Invalid', cls: styles.badgeRed },
};

export function EmailLogsOffcanvas({ enrollment, onClose }: EmailLogsOffcanvasProps) {
  // ── Draft filter state (what the user is typing) ──
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterRecipient, setFilterRecipient] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('All');

  // ── Applied query params (committed on Search click) ──
  const [queryParams, setQueryParams] = useState<EmailLogsParams>({
    enrollment_id: String(enrollment.id),
    page: 1,
    per_page: PAGE_SIZE,
  });

  // ── Sub-panels ──
  const [selectedLog, setSelectedLog] = useState<ApiEmailLog | null>(null);
  const [forwardLog, setForwardLog] = useState<ApiEmailLog | null>(null);
  const [forwardEmail, setForwardEmail] = useState('');
  const [forwardEmailError, setForwardEmailError] = useState('');

  // ── API ──
  const { data, isLoading, isError } = useEmailLogsQuery(queryParams);
  const logs = data?.data ?? [];
  const meta = data?.meta;

  const { data: contentData, isLoading: isContentLoading } = useEmailLogContentQuery(
    selectedLog?.id
  );

  const forwardMutation = useForwardEmailMutation();
  const resendMutation = useResendEmailMutation();
  const [resendingId, setResendingId] = useState<string | null>(null);

  // ── ESC key handling ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (forwardLog) {
        setForwardLog(null);
        return;
      }
      if (selectedLog) {
        setSelectedLog(null);
        return;
      }
      onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, forwardLog, selectedLog]);

  const agentEmail = enrollment.agentName.toLowerCase().replace(/\s+/g, '.') + '@agency.com';

  function applySearch() {
    setQueryParams({
      enrollment_id: String(enrollment.id),
      subject: filterSubject || undefined,
      sent_date_from: filterDateFrom || undefined,
      sent_date_to: filterDateTo || undefined,
      recipient: filterRecipient || undefined,
      email_status: filterStatus !== 'All' ? filterStatus : undefined,
      page: 1,
      per_page: PAGE_SIZE,
    });
  }

  function clearFilters() {
    setFilterSubject('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterRecipient('');
    setFilterStatus('All');
    setQueryParams({ enrollment_id: String(enrollment.id), page: 1, per_page: PAGE_SIZE });
  }

  function goToPage(p: number) {
    setQueryParams((prev) => ({ ...prev, page: p }));
  }

  function openForward(log: ApiEmailLog) {
    setForwardLog(log);
    setForwardEmail('');
    setForwardEmailError('');
  }

  function handleForwardSubmit() {
    if (!forwardEmail.trim()) {
      setForwardEmailError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forwardEmail.trim())) {
      setForwardEmailError('Enter a valid email address.');
      return;
    }
    forwardMutation.mutate(
      { id: forwardLog!.id, email: forwardEmail.trim() },
      {
        onSuccess: () => {
          setForwardLog(null);
          setForwardEmail('');
          setForwardEmailError('');
          toast.success('Email forwarded successfully');
        },
        onError: () => {
          setForwardEmailError('Failed to forward email. Please try again.');
        },
      }
    );
  }

  function handleResend(log: ApiEmailLog) {
    setResendingId(log.id);
    resendMutation.mutate(log.id, {
      onSuccess: () => {
        toast.success('Email resent successfully');
      },
      onError: () => {
        toast.error('Failed to resend email. Please try again.');
      },
      onSettled: () => setResendingId(null),
    });
  }

  function pageNumbers(): number[] {
    const currentPage = queryParams.page ?? 1;
    const totalPages = meta?.total_pages ?? 1;
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }

  const currentPage = queryParams.page ?? 1;
  const totalPages = meta?.total_pages ?? 1;

  return (
    <>
      {/* ── Backdrop ── */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* ── Main Panel ── */}
      <div className={`${styles.panel} ${selectedLog ? styles.panelSlideOut : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <HiOutlineMail />
            </div>
            <div>
              <div className={styles.headerTitle}>Email Logs</div>
              <div className={styles.headerSubtitle}>
                {enrollment.name} · {enrollment.policyId}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <HiOutlineX />
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filtersBar}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Subject</label>
              <input
                className={styles.filterInput}
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="Search subject..."
              />
            </div>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Date From</label>
              <input
                className={styles.filterInput}
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Date To</label>
              <input
                className={styles.filterInput}
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Recipient (To / CC / BCC)</label>
              <input
                className={styles.filterInput}
                value={filterRecipient}
                onChange={(e) => setFilterRecipient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="Search recipient..."
              />
            </div>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Mail Status</label>
              <select
                className={styles.filterSelect}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
              >
                <option value="All">All Statuses</option>
                {(Object.keys(STATUS_CONFIG) as EmailStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.filterActionsRow}>
            <button className={styles.clearBtn} onClick={clearFilters}>
              <HiOutlineRefresh /> Clear Search
            </button>
            <button className={styles.searchBtn} onClick={applySearch}>
              <HiOutlineSearch /> Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          {isError ? (
            <div className={styles.emptyState}>Failed to load email logs.</div>
          ) : !isLoading && logs.length === 0 ? (
            <div className={styles.emptyState}>
              <HiOutlineInbox />
              No email logs match the current filters.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>ID</th>
                  <th className={styles.th}>Recipient</th>
                  <th className={styles.th}>Subject</th>
                  <th className={styles.th}>Date Sent</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: PAGE_SIZE }, (_, i) => (
                      <tr key={`skel-${i}`} className={styles.tr}>
                        <td className={styles.td}>
                          <div className={styles.skeletonBar} style={{ width: 48 }} />
                        </td>
                        <td className={styles.td}>
                          <div className={styles.skeletonBar} style={{ width: '80%' }} />
                        </td>
                        <td className={styles.td}>
                          <div className={styles.skeletonBar} style={{ width: '90%' }} />
                        </td>
                        <td className={styles.td}>
                          <div className={styles.skeletonBar} style={{ width: 90 }} />
                        </td>
                        <td className={styles.td}>
                          <div
                            className={styles.skeletonBar}
                            style={{ width: 56, borderRadius: 10 }}
                          />
                        </td>
                        <td className={styles.td}>
                          <div className={styles.skeletonBar} style={{ width: 60 }} />
                        </td>
                      </tr>
                    ))
                  : logs.map((log) => (
                      <tr key={log.id} className={styles.tr}>
                        <td className={styles.td}>
                          <span className={styles.logId}>{log.id}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.recipient} title={log.to}>
                            {log.to}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.subject}>{log.subject}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.date}>{formatDateTime(log.sentAt)}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.badge} ${STATUS_CONFIG[log.emailStatus].cls}`}>
                            {STATUS_CONFIG[log.emailStatus].label}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.actions}>
                            <div className={styles.tooltipWrapper} data-tooltip="View Detail">
                              <button
                                className={styles.actionView}
                                onClick={() => setSelectedLog(log)}
                                aria-label="View email detail"
                              >
                                <HiOutlineEye />
                              </button>
                            </div>
                            <div className={styles.tooltipWrapper} data-tooltip="Forward Email">
                              <button
                                className={styles.actionForward}
                                onClick={() => openForward(log)}
                                aria-label="Forward email"
                              >
                                <HiOutlineReply style={{ transform: 'scaleX(-1)' }} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {(meta?.total_pages ?? 0) > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, meta?.total ?? 0)} of {meta?.total ?? 0}
            </span>
            <div className={styles.paginationButtons}>
              <button
                className={styles.pageBtn}
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                aria-label="Previous page"
              >
                <HiOutlineChevronLeft />
              </button>
              {pageNumbers().map((n) => (
                <button
                  key={n}
                  className={`${styles.pageBtn} ${n === currentPage ? styles.pageBtnActive : ''}`}
                  onClick={() => goToPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                aria-label="Next page"
              >
                <HiOutlineChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          Email Detail Sub-Panel
      ════════════════════════════════════════ */}
      {selectedLog && (
        <>
          <div className={styles.detailBackdrop} onClick={() => setSelectedLog(null)} />
          <div className={styles.detailPanel}>
            {/* Detail Header */}
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderLeft}>
                <div className={styles.detailHeaderIcon}>
                  <HiOutlineMail />
                </div>
                <div>
                  <div className={styles.detailTitle}>Email Detail</div>
                  <div className={styles.detailSubtitle}>{selectedLog.id}</div>
                </div>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedLog(null)}
                aria-label="Close"
              >
                <HiOutlineX />
              </button>
            </div>

            {/* Detail Body */}
            <div className={styles.detailBody}>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>From</span>
                <span className={styles.detailValue}>noreply@coreenroll.com</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Date</span>
                <span className={styles.detailValue}>{formatDateTime(selectedLog.sentAt)}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>To</span>
                <span className={styles.detailValue}>{selectedLog.to}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>CC</span>
                <span className={styles.detailValue}>{selectedLog.cc || agentEmail}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>BCC</span>
                {selectedLog.bcc ? (
                  <span className={styles.detailValue}>{selectedLog.bcc}</span>
                ) : (
                  <span className={styles.detailValueMuted}>—</span>
                )}
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Subject</span>
                <span className={styles.detailValue}>{selectedLog.subject}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Status</span>
                <span className={`${styles.badge} ${STATUS_CONFIG[selectedLog.emailStatus].cls}`}>
                  {STATUS_CONFIG[selectedLog.emailStatus].label}
                </span>
              </div>

              {/* Email Body Preview */}
              <div className={styles.detailBodySection}>
                <span className={styles.detailLabel}>Email Body</span>
                {isContentLoading ? (
                  <div className={styles.emailBodyPlaceholder}>
                    <Spinner size="sm" decorative />
                    Loading preview…
                  </div>
                ) : contentData?.previewContent ? (
                  <iframe
                    className={styles.emailIframe}
                    srcDoc={contentData.previewContent}
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className={styles.emailBodyPlaceholder}>No preview available.</div>
                )}
              </div>
            </div>

            {/* Detail Footer */}
            <div className={styles.detailFooter}>
              <button className={styles.cancelBtn} onClick={() => setSelectedLog(null)}>
                Close
              </button>
              <button
                className={styles.forwardBtn}
                onClick={() => handleResend(selectedLog)}
                disabled={resendingId === selectedLog.id}
              >
                {resendingId === selectedLog.id ? 'Resending…' : 'Resend'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          Forward Email Modal
      ════════════════════════════════════════ */}
      {forwardLog && (
        <>
          <div className={styles.forwardBackdrop} onClick={() => setForwardLog(null)} />
          <div className={styles.forwardModal}>
            {/* Forward Header */}
            <div className={styles.forwardHeader}>
              <div className={styles.forwardHeaderLeft}>
                <div className={styles.forwardHeaderIcon}>
                  <HiOutlinePaperAirplane />
                </div>
                <div>
                  <div className={styles.forwardTitle}>Forward Email</div>
                </div>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setForwardLog(null)}
                aria-label="Close"
              >
                <HiOutlineX />
              </button>
            </div>

            {/* Forward Body */}
            <div className={styles.forwardBody}>
              <div className={styles.forwardFieldGroup}>
                <label className={styles.forwardLabel}>Email Address</label>
                <input
                  className={`${styles.forwardInput} ${forwardEmailError ? styles.forwardInputError : ''}`}
                  type="email"
                  value={forwardEmail}
                  onChange={(e) => {
                    setForwardEmail(e.target.value);
                    setForwardEmailError('');
                  }}
                  placeholder="recipient@example.com"
                  autoFocus
                />
                {forwardEmailError && (
                  <div className={styles.forwardError}>
                    <HiOutlineExclamationCircle />
                    {forwardEmailError}
                  </div>
                )}
              </div>
            </div>

            {/* Forward Footer */}
            <div className={styles.forwardFooter}>
              <button className={styles.cancelBtn} onClick={() => setForwardLog(null)}>
                Close
              </button>
              <button
                className={styles.forwardSubmitBtn}
                onClick={handleForwardSubmit}
                disabled={forwardMutation.isPending}
              >
                {forwardMutation.isPending ? 'Sending…' : 'Forward'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
