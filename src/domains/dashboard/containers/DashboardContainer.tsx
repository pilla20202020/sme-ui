import { Dashboard } from '../pages/Dashboard';
import { useDashboard } from '../hooks/useDashboard';
import { buildKpiCardsFromLive } from '../utils/kpiData';

interface Props {
  onNavigate: (page: string, status?: string) => void;
}

export function DashboardContainer({ onNavigate }: Props) {
  const { data, isLoading: isDashboardLoading } = useDashboard();

  const kpiCards = buildKpiCardsFromLive(data?.counts ?? {});

  return (
    <Dashboard
      kpiCards={kpiCards}
      recentActivity={data?.recentActivity ?? []}
      isLoading={isDashboardLoading}
      onNavigate={onNavigate}
      recentEnrollments={data?.recentEnrollments ?? []}
      rejectionBreakdown={data?.rejectionBreakdown}
      attentionQueue={data?.attentionQueue}
      weeklyEnrollments={data?.weeklyEnrollments}
    />
  );
}
