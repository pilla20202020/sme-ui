import { useTheme } from '@/app/providers/ThemeContext';

interface InfoGridItem {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}

interface InfoGridProps {
  items: InfoGridItem[];
}

export function InfoGrid({ items }: InfoGridProps) {
  const { T } = useTheme();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
          <div style={{ fontSize: 14, color: T.text, fontFamily: item.mono ? 'monospace' : undefined }}>{item.value ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}



