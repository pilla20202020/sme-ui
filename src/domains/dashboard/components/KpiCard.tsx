import type { IconType } from 'react-icons';
import type { KpiCardData } from '../utils/kpiData';
import { useTheme } from '@/app/providers/ThemeContext';
import styles from './KpiCard.module.css';

type KpiCardProps = Pick<KpiCardData, 'label' | 'value' | 'dotColor'> & {
  icon?: IconType;
  onClick?: () => void;
};

export function KpiCard({ label, value, dotColor, icon: Icon, onClick }: KpiCardProps) {
  const { T } = useTheme();
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={styles.kpiCard}
      style={{
        background: T.bgCard,
        borderRadius: 14,
        boxShadow: T.shadow,
        border: '1px solid ' + T.border,
        cursor: onClick ? 'pointer' : undefined,
        width: onClick ? '100%' : undefined,
        font: onClick ? 'inherit' : undefined,
        textAlign: onClick ? 'left' : undefined,
      }}
      onClick={onClick}
    >
      <div className={styles.label}>{label}</div>
      <div className={styles.bottom}>
        <div className={styles.value}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className={styles.iconBox} style={{ background: dotColor + '18', color: dotColor }}>
          {Icon ? (
            <Icon size={20} />
          ) : (
            <span className={styles.dot} style={{ background: dotColor }} />
          )}
        </div>
      </div>
    </Tag>
  );
}
