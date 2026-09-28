import Chart from 'react-apexcharts';
import { useTheme } from '@/app/providers/ThemeContext';
import type { DashboardWeeklyEnrollments } from '../api/dashboardApi';
import styles from './WeeklyAreaChart.module.css';

interface WeeklyAreaChartProps {
  data?: DashboardWeeklyEnrollments;
}

export function WeeklyAreaChart({ data }: WeeklyAreaChartProps) {
  const { T, darkMode } = useTheme();
  const primaryColor = '#0cf';

  const labels = data?.labels ?? [];
  const approvedByDay = data?.approvedByDay ?? [];
  const rejectedByDay = data?.rejectedByDay ?? [];
  const totalApproved = data?.approved ?? 0;
  const totalRejected = data?.rejected ?? 0;

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false },
      background: 'transparent',
      animations: { enabled: true, speed: 400, dynamicAnimation: { enabled: true, speed: 300 } },
    },
    colors: [primaryColor, T.red],
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] },
    },
    stroke: {
      curve: 'smooth',
      width: [2.5, 2],
      dashArray: [0, 4],
    },
    xaxis: {
      categories: labels,
      labels: { style: { colors: T.textMuted, fontSize: '10px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: { borderColor: T.border, strokeDashArray: 3, padding: { left: 0, right: 0 } },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      x: { show: true },
    },
  };

  const series = [
    { name: 'Approved', data: approvedByDay },
    { name: 'Rejected', data: rejectedByDay },
  ];

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
      <div className={styles.header}>
        <div className={styles.title}>Weekly Enrollments</div>
      </div>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statDot} style={{ background: primaryColor }} />
          <span className={styles.statLabel}>Approved</span>
          <span className={styles.statValue}>{totalApproved}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statDot} style={{ background: T.red }} />
          <span className={styles.statLabel}>Rejected</span>
          <span className={styles.statValue}>{totalRejected}</span>
        </div>
      </div>
      <Chart options={options} series={series} type="area" height={120} />
    </div>
  );
}
