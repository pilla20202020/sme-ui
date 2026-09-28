import { useTheme } from '@/app/providers/ThemeContext';
import type { DashboardRejectionBreakdown } from '../api/dashboardApi';
import styles from './RejectionBreakdown.module.css';

interface RejectionBreakdownProps {
  data?: DashboardRejectionBreakdown;
}

export function RejectionBreakdown({ data }: RejectionBreakdownProps) {
  const { T } = useTheme();
  const uwColor = T.indigo;
  const memberColor = T.red;

  const declinedUW = data?.declined_by_uw ?? 0;
  const declinedMember = data?.declined_by_member ?? 0;
  const total = declinedUW + declinedMember;
  const uwPct = total > 0 ? Math.round((declinedUW / total) * 100) : 50;
  const memPct = 100 - uwPct;

  return (
    <div
      className={styles.card}
      style={{
        background: T.bgCard,
        borderRadius: 14,
        boxShadow: T.shadow,
        border: '1px solid ' + T.border,
      }}
    >
      <div className={styles.title}>Rejection Breakdown</div>

      <div className={styles.row}>
        <div className={styles.rowLabel}>
          <span className={styles.dot} style={{ background: uwColor }} />
          <span className={styles.label}>Declined by Underwriting</span>
        </div>
        <span className={styles.value} style={{ color: uwColor }}>
          {declinedUW}
        </span>
      </div>

      <div className={styles.row}>
        <div className={styles.rowLabel}>
          <span className={styles.dot} style={{ background: memberColor }} />
          <span className={styles.label}>Declined by Member</span>
        </div>
        <span className={styles.value} style={{ color: memberColor }}>
          {declinedMember}
        </span>
      </div>

      <div className={styles.barTrack}>
        <div className={styles.barSegment} style={{ width: uwPct + '%', background: uwColor }} />
        <div
          className={styles.barSegment}
          style={{ width: memPct + '%', background: memberColor }}
        />
      </div>
    </div>
  );
}
