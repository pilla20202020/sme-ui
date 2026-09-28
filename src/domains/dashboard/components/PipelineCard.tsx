import { useTheme } from '@/app/providers/ThemeContext';

interface PipelineItem {
  label: string;
  count: number;
  color: string;
}

interface PipelineCardProps {
  items: PipelineItem[];
  max: number;
}

export function PipelineCard({ items, max }: PipelineCardProps) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.bgCard, borderRadius: 14, padding: '16px 18px',
      boxShadow: T.shadow, border: '1px solid ' + T.border,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Pipeline Breakdown</div>
      {items.map((p, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: T.textSub }}>{p.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: 'monospace' }}>{p.count.toLocaleString()}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: T.bgHover }}>
            <div style={{
              height: '100%', borderRadius: 3, background: p.color,
              width: Math.max(max > 0 ? (p.count / max) * 100 : 0, 2) + '%',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}




