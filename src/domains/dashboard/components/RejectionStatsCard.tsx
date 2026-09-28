import { useTheme } from '@/app/providers/ThemeContext';

export function RejectionStatsCard() {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.bgCard, borderRadius: 14, padding: 24,
      boxShadow: T.shadow, border: '1px solid ' + T.border,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 20 }}>Rejection Statistics</div>
      {[
        { label: 'Declined by Underwriting', value: 156 },
        { label: 'Declined by Member', value: 89 },
      ].map((item, i) => (
        <div key={i} style={{
          padding: 16, borderRadius: 10,
          background: T.redLight, border: '1px solid ' + T.red + '20',
          marginBottom: i === 0 ? 12 : 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.red, fontFamily: 'monospace', marginTop: 4 }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}




