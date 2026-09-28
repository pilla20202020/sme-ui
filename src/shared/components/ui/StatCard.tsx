import { useTheme } from '@/app/providers/ThemeContext';

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
  const { T } = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        background: T.bgCard, borderRadius: 14, padding: '20px 24px',
        boxShadow: T.shadow, border: '1px solid ' + T.border,
        borderLeft: '4px solid ' + accent,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.18s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: T.text }}>{value}</div>
          {trend !== undefined && (
            <div style={{ fontSize: 12, color: trendDir === 'up' ? T.green : T.red, marginTop: 4 }}>
              {trendDir === 'up' ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            fontSize: 22, color: accent, background: accent + '18',
            borderRadius: 12, padding: '8px 10px', lineHeight: 1,
          }}>{icon}</div>
        )}
      </div>
    </div>
  );
}



