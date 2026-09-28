import { useTheme } from '@/app/providers/ThemeContext';
import { STATUS } from '@/shared/constants';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { T } = useTheme();
  const cfg = STATUS[status] ?? { color: T.slate, dot: T.slate };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 20,
      background: cfg.color + '18',
      border: '1px solid ' + cfg.color + '30',
      color: cfg.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
      width: 'fit-content',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}



