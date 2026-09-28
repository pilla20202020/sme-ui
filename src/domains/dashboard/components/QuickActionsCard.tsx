import { useTheme } from '@/app/providers/ThemeContext';

interface QuickAction {
  label: string;
  icon: string;
  action: () => void;
}

interface QuickActionsCardProps {
  actions: QuickAction[];
}

export function QuickActionsCard({ actions }: QuickActionsCardProps) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.bgCard, borderRadius: 14, padding: 24,
      boxShadow: T.shadow, border: '1px solid ' + T.border,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 20 }}>Quick Actions</div>
      {actions.map((qa, i) => (
        <div
          key={i}
          onClick={qa.action}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && qa.action()}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.bgHover}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
        >
          <span style={{ fontSize: 16, width: 20, textAlign: 'center', color: T.indigo }}>{qa.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{qa.label}</span>
          <span style={{ marginLeft: 'auto', color: T.textMuted, fontSize: 14 }}>→</span>
        </div>
      ))}
    </div>
  );
}




