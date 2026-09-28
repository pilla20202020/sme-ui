import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchPipelineStats, type Timeframe } from '../api/dashboardApi';

export const PIPELINE_STATS_QUERY_KEY = 'dashboard-pipeline-stats';

export function usePipelineStats(timeframe: Timeframe, year?: number, startDate?: string) {
  return useQuery({
    queryKey: [PIPELINE_STATS_QUERY_KEY, timeframe, year, startDate],
    queryFn: ({ signal }) => fetchPipelineStats(timeframe, signal, year, startDate),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}
