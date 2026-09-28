import { useTheme } from '@/app/providers/ThemeContext';

interface SectionDividerProps {
  label: string;
}

export function SectionDivider({ label }: SectionDividerProps) {
  const { T } = useTheme();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      margin: '12px 0', color: T.indigoDim,
    }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}



