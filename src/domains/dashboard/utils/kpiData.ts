import type { IconType } from 'react-icons';
import { MdCheckCircle, MdCancel, MdPendingActions, MdPeople, MdPersonOff } from 'react-icons/md';

export interface KpiStaticItem {
  id: string;
  label: string;
  dotColor: string;
  icon: IconType;
  navigateStatus?: string;
}

export interface KpiCardData {
  id: string;
  label: string;
  value: number;
  dotColor: string;
  icon: IconType;
  navigateStatus?: string;
}

export const KPI_STATIC_JSON: KpiStaticItem[] = [
  {
    id: 'total_enrollments',
    label: 'Total Enrollments',
    dotColor: '#2F7AF8',
    icon: MdPeople,
    navigateStatus: 'All',
  },
  {
    id: 'pending_uw',
    label: 'Pending Underwriting',
    dotColor: '#F59E0B',
    icon: MdPendingActions,
    navigateStatus: 'Pending Underwriting',
  },
  {
    id: 'active',
    label: 'Active',
    dotColor: '#10B981',
    icon: MdCheckCircle,
    navigateStatus: 'Active',
  },
  {
    id: 'declined_by_uw',
    label: 'Declined By Underwriting',
    dotColor: '#EF4444',
    icon: MdCancel,
    navigateStatus: 'Declined by UW',
  },
  {
    id: 'declined_by_member',
    label: 'Declined By Member',
    dotColor: '#8B5CF6',
    icon: MdPersonOff,
    navigateStatus: 'Declined by Member',
  },
];

const LIVE_COUNT_TO_ITEM_ID: Record<string, string> = {
  total: 'total_enrollments',
  pending_underwriting: 'pending_uw',
  active: 'active',
  declined_by_uw: 'declined_by_uw',
  declined_by_member: 'declined_by_member',
};

export function buildKpiCardsFromLive(liveCounts: Record<string, number>): KpiCardData[] {
  const valueById: Record<string, number> = {};
  for (const [countKey, itemId] of Object.entries(LIVE_COUNT_TO_ITEM_ID)) {
    valueById[itemId] = liveCounts[countKey] ?? 0;
  }
  return KPI_STATIC_JSON.map((item) => ({
    id: item.id,
    label: item.label,
    value: valueById[item.id] ?? 0,
    dotColor: item.dotColor,
    icon: item.icon,
    navigateStatus: item.navigateStatus,
  }));
}
