import { useTheme } from '@/app/providers/ThemeContext';
import { StatusBadge, SkeletonLoader } from '@/shared/components/ui';
import { API_TO_UI_STATUS } from '@/shared/constants';
import type { DashboardActivity } from '../api/dashboardApi';

interface RecentActivityCardProps {
  onViewAll: () => void;
  activities: DashboardActivity[];
  isLoading?: boolean;
}

function formatPerformedAt(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
}

export function RecentActivityCard({ activities, isLoading }: RecentActivityCardProps) {
  const { T } = useTheme();

  return (
    <div
      style={{
        background: T.bgCard,
        borderRadius: 14,
        padding: 20,
        boxShadow: T.shadow,
        border: '1px solid ' + T.border,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Recent Activity</div>
        {/* View all — re-enable once the activity page is ready
        <button
          onClick={onViewAll}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#0cf',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '4px 8px',
            borderRadius: 6,
          }}
        >
          View all →
        </button>
        */}
      </div>

      {isLoading && <SkeletonLoader blocks={4} linesPerBlock={1} showTitle />}

      {!isLoading && activities.length === 0 && (
        <div style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
          No recent activity.
        </div>
      )}

      {!isLoading &&
        activities.map((a, i) => {
          const { date, time } = formatPerformedAt(a.performedAt);
          const uiStatus = API_TO_UI_STATUS[a.status as keyof typeof API_TO_UI_STATUS] ?? a.status;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < activities.length - 1 ? '1px solid ' + T.borderLight : 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: T.text }}>
                  <span style={{ fontWeight: 600 }}>{a.actor}</span> — {a.action}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 11, color: T.textMuted }}>{date}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>·</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{time}</span>
                  <StatusBadge status={uiStatus} />
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
