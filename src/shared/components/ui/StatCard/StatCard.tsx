import { Card } from '@/shared/components/ui/Card';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: number | string;
  accent: string;
  trend?: number | string;
  trendDir?: 'up' | 'down';
  icon?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, accent, trend, trendDir, icon, onClick }: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={styles.statCard}
      style={{ borderLeftColor: accent }}
    >
      <div className={styles.header}>
        <div>
          <div className={styles.label}>{label}</div>
          <div className={styles.value}>{value}</div>
          {trend !== undefined && (
            <div className={`${styles.trend} ${trendDir === 'up' ? styles.trendUp : styles.trendDown}`}>
              {trendDir === 'up' ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={styles.iconBox}
            style={{ color: accent, background: accent + '18' }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;



