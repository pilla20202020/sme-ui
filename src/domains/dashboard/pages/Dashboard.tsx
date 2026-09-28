import { Topbar } from '@/layouts';
import { KpiCard } from '../components/KpiCard';
import { WeeklyAreaChart } from '../components/WeeklyAreaChart';
import { RejectionBreakdown } from '../components/RejectionBreakdown';
import { AttentionQueue } from '../components/AttentionQueue';
import { RecentEnrollmentsTable } from '../components/RecentEnrollmentsTable';
import { EnrollmentVsRejectChart } from '../components/EnrollmentVsRejectChart';
import { RecentActivityCard } from '../components/RecentActivityCard';
import type { KpiCardData } from '../utils/kpiData';
import type {
  DashboardActivity,
  DashboardRecentEnrollment,
  DashboardRejectionBreakdown,
  DashboardAttentionQueue,
  DashboardWeeklyEnrollments,
} from '../api/dashboardApi';
import styles from './Dashboard.module.css';

interface DashboardProps {
  kpiCards: KpiCardData[];
  recentActivity: DashboardActivity[];
  isLoading?: boolean;
  onNavigate: (page: string, status?: string) => void;
  recentEnrollments?: DashboardRecentEnrollment[];
  rejectionBreakdown?: DashboardRejectionBreakdown;
  attentionQueue?: DashboardAttentionQueue;
  weeklyEnrollments?: DashboardWeeklyEnrollments;
}

export function Dashboard({
  kpiCards,
  recentActivity,
  isLoading,
  onNavigate,
  recentEnrollments,
  rejectionBreakdown,
  attentionQueue,
  weeklyEnrollments,
}: DashboardProps) {
  return (
    <div>
      <Topbar
        title="Underwriting Dashboard"
        subtitle="L713 Medical Underwriting · Individual Enrollment"
        compactMobile
      />

      <div className={styles.mobileHeaderMeta}>
        <div className={styles.mobileHeaderTitle}>Underwriting Dashboard</div>
        <div className={styles.mobileHeaderSubtitle}>
          L713 Medical Underwriting · Individual Enrollment
        </div>
      </div>
      <div className={styles.kpiGrid}>
        {kpiCards.map((card) => (
          <KpiCard
            key={card.id}
            label={card.label}
            value={card.value}
            dotColor={card.dotColor}
            icon={card.icon}
            onClick={
              card.navigateStatus ? () => onNavigate('enrollments', card.navigateStatus) : undefined
            }
          />
        ))}
      </div>
      <div className={styles.dashboard}>
        {/* ── Left Panel ── */}
        <div className={styles.leftPanel}>
          <EnrollmentVsRejectChart />

          <RecentEnrollmentsTable
            onViewAll={() => onNavigate('enrollments', 'All')}
            enrollments={recentEnrollments}
            isLoading={isLoading}
          />

          <RecentActivityCard
            onViewAll={() => onNavigate('activity')}
            activities={recentActivity}
            isLoading={isLoading}
          />
        </div>

        <div className={styles.rightPanel}>
          <WeeklyAreaChart data={weeklyEnrollments} />
          <RejectionBreakdown data={rejectionBreakdown} />
          <AttentionQueue data={attentionQueue} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
