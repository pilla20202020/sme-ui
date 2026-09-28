import { useMemo } from 'react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { HiOutlineLocationMarker, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';
import { useTheme } from '@/app/providers/ThemeContext';
import { StatusBadge, EnrollmentTable } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils';
import { API_TO_UI_STATUS } from '@/shared/constants';
import type { DashboardRecentEnrollment } from '../api/dashboardApi';
import styles from './RecentEnrollmentsTable.module.css';

interface RecentEnrollmentsTableProps {
  onViewAll: () => void;
  enrollments?: DashboardRecentEnrollment[];
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<DashboardRecentEnrollment>();

export function RecentEnrollmentsTable({
  onViewAll,
  enrollments = [],
  isLoading,
}: RecentEnrollmentsTableProps) {
  const { T } = useTheme();

  const columns = useMemo(
    (): ColumnDef<DashboardRecentEnrollment, any>[] => [
      columnHelper.accessor('policyId', {
        header: 'ID',
        cell: (info) => {
          const e = info.row.original;
          const uiStatus = API_TO_UI_STATUS[e.status as keyof typeof API_TO_UI_STATUS] ?? e.status;
          return (
            <div className={styles.idCell}>
              <span className={styles.caseId}>{e.policyId}</span>
              <div className={styles.cellSubText}>{e.memberInfo.id}</div>
              <StatusBadge status={uiStatus} />
            </div>
          );
        },
      }),
      columnHelper.accessor('memberInfo', {
        header: 'Member Details',
        cell: (info) => {
          const { memberInfo } = info.row.original;
          return (
            <div className={styles.memberCell}>
              <div className={styles.memberName}>{memberInfo.name}</div>
              <div className={styles.memberDetail}>
                <HiOutlineLocationMarker className={styles.memberIcon} />
                <span>{memberInfo.address}</span>
              </div>
              <div className={styles.memberDetail}>
                <HiOutlineMail className={styles.memberIcon} />
                <span>{memberInfo.email}</span>
              </div>
              <div className={styles.memberDetail}>
                <HiOutlinePhone className={styles.memberIcon} />
                <span>{memberInfo.phone}</span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('plan', {
        header: 'Plan & Premium',
        cell: (info) => {
          const { plan } = info.row.original;
          if (!plan) return <div className={styles.cellSubText}>—</div>;
          return (
            <div>
              <div className={styles.planName}>{plan.planName}</div>
              {plan.tier && <div className={styles.cellSubText}>{plan.tier}</div>}
              <div className={styles.planPrice}>{formatCurrency(parseFloat(plan.premium))}</div>
            </div>
          );
        },
      }),
    ],
    []
  );

  const recentData = useMemo(() => enrollments.slice(0, 5), [enrollments]);

  return (
    <div
      className={styles.wrapper}
      style={{
        background: T.bgCard,
        borderRadius: 14,
        boxShadow: T.shadow,
        border: '1px solid ' + T.border,
      }}
    >
      <div className={styles.header}>
        <span className={styles.title}>Recent Enrollments</span>
        <button className={styles.viewAll} onClick={onViewAll}>
          View all →
        </button>
      </div>
      <EnrollmentTable
        data={recentData}
        columns={columns}
        pageSize={5}
        showPagination={false}
        emptyMessage="No recent enrollments."
        noScroll
        isLoading={isLoading}
        skeletonRows={5}
      />
    </div>
  );
}
