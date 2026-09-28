import { useTheme } from '@/app/providers/ThemeContext';
import { STATUS } from '@/shared/constants';
import styles from './Badge.module.css';

interface BadgeProps {
  status: string;
}

export function Badge({ status }: BadgeProps) {
  const { T } = useTheme();
  const cfg = STATUS[status] ?? { color: T.slate, dot: T.slate };

  return (
    <span
      className={styles.badge}
      style={{
        background: cfg.color + '18',
        border: '1px solid ' + cfg.color + '30',
        color: cfg.color,
      }}
    >
      <span className={styles.dot} style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

export default Badge;



