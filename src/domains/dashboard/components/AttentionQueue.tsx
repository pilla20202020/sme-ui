import { useTheme } from '@/app/providers/ThemeContext';
import { MdWarning, MdHelp, MdEmail, MdChevronRight, MdCheckCircle } from 'react-icons/md';
import styles from './AttentionQueue.module.css';
import type { IconType } from 'react-icons';
import type { DashboardAttentionQueue } from '../api/dashboardApi';

interface AlertItem {
  icon: IconType;
  label: string;
  count: number;
  color: string;
  /** Enrollment status filter this row navigates to. Omitted when no matching filter exists. */
  status?: string;
}

interface AttentionQueueProps {
  data?: DashboardAttentionQueue;
  onNavigate?: (page: string, status?: string) => void;
}

export function AttentionQueue({ data, onNavigate }: AttentionQueueProps) {
  const { T } = useTheme();

  const alerts: AlertItem[] = [
    {
      icon: MdWarning,
      label: 'Overdue Reviews (>48h)',
      count: data?.overdueReviews ?? 0,
      color: T.red,
      status: 'Pending Underwriting',
    },
    {
      icon: MdHelp,
      label: 'Unanswered Questions',
      count: data?.unansweredQuestions ?? 0,
      color: T.amber,
      status: 'Pending Response',
    },
    {
      icon: MdEmail,
      label: 'Bounced Emails',
      count: data?.bouncedEmails ?? 0,
      color: T.sky,
      // No list-level filter exists for bounced emails yet — row stays informational only.
    },
  ];

  const total = alerts.reduce((sum, a) => sum + a.count, 0);

  return (
    <div
      className={styles.card}
      style={{
        background: T.bgCard,
        borderRadius: 14,
        padding: 20,
        boxShadow: T.shadow,
        border: '1px solid ' + T.border,
      }}
    >
      <div className={styles.headerRow}>
        <div className={styles.title} style={{ color: T.text }}>
          Attention Queue
        </div>
        {total > 0 ? (
          <span className={styles.totalBadge} style={{ background: T.amberDim, color: T.amber }}>
            {total} need action
          </span>
        ) : (
          <span className={styles.allClear} style={{ color: T.green }}>
            <MdCheckCircle size={13} />
            All clear
          </span>
        )}
      </div>

      <div className={styles.list}>
        {alerts.map((a, i) => {
          const active = a.count > 0;
          const clickable = active && !!a.status && !!onNavigate;
          const Tag = clickable ? 'button' : 'div';

          return (
            <Tag
              key={i}
              type={clickable ? 'button' : undefined}
              className={[styles.alertItem, clickable ? styles.alertItemClickable : ''].join(' ')}
              style={{ background: active ? T.bgHover : T.bgAlt }}
              onClick={clickable ? () => onNavigate?.('enrollments', a.status) : undefined}
            >
              <span
                className={styles.alertIcon}
                style={{
                  background: active ? a.color + '18' : T.border,
                  color: active ? a.color : T.textMuted,
                }}
              >
                <a.icon size={15} />
              </span>
              <span className={styles.alertText} style={{ color: active ? T.text : T.textMuted }}>
                {a.label}
              </span>
              <span
                className={styles.alertCount}
                style={{
                  background: active ? a.color + '20' : T.border,
                  color: active ? a.color : T.textMuted,
                }}
              >
                {a.count}
              </span>
              {clickable && (
                <MdChevronRight
                  size={16}
                  className={styles.chevron}
                  style={{ color: T.textMuted }}
                />
              )}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
